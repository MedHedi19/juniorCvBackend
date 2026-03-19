/* eslint-disable no-console */
const mongoose = require('mongoose');
require('dotenv').config();

const UserProgress = require('./src/models/userProgress');
const {
  ensureQuizModulesSeeded,
  getAllQuizModules,
  buildQuestionSnapshotsFromIds,
  buildQuestionSnapshotsFromIndexes,
} = require('./src/utils/quizModuleService');

const findModuleForProgress = (progress, modules) => {
  if (!progress) {
    return null;
  }

  if (progress.moduleId) {
    const byId = modules.find((module) => String(module._id) === String(progress.moduleId));
    if (byId) {
      return byId;
    }
  }

  if (progress.moduleSlug) {
    const bySlug = modules.find((module) => module.slug === progress.moduleSlug);
    if (bySlug) {
      return bySlug;
    }
  }

  if (progress.quizName) {
    return modules.find((module) => module.name === progress.quizName) || null;
  }

  return null;
};

const ensureSnapshotsForProgress = (progress, module) => {
  let snapshots = Array.isArray(progress.selectedQuestionSnapshots)
    ? progress.selectedQuestionSnapshots.filter((snapshot) => snapshot && snapshot.question)
    : [];

  if (snapshots.length === 0) {
    snapshots = buildQuestionSnapshotsFromIds(module, progress.selectedQuestionIds);
  }

  if (snapshots.length === 0) {
    snapshots = buildQuestionSnapshotsFromIndexes(module, progress.selectedQuestions);
  }

  if (snapshots.length === 0) {
    return { changed: false, snapshots: [] };
  }

  progress.selectedQuestionSnapshots = snapshots;
  progress.selectedQuestionIds = snapshots.map((snapshot) => snapshot.questionId);
  progress.totalQuestions = snapshots.length;

  return { changed: true, snapshots };
};

const attachSnapshotsToAnswers = (progress, snapshots) => {
  if (!Array.isArray(progress.answers) || progress.answers.length === 0) {
    return false;
  }

  let changed = false;

  progress.answers.forEach((answer) => {
    if (!answer || (answer.questionSnapshot && answer.questionSnapshot.question)) {
      return;
    }

    const snapshot = snapshots[answer.questionIndex];
    if (!snapshot) {
      return;
    }

    answer.questionId = answer.questionId || snapshot.questionId;
    answer.questionSnapshot = snapshot;
    changed = true;
  });

  return changed;
};

const migrate = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required in environment variables.');
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log('Connected to MongoDB.');

  await ensureQuizModulesSeeded();
  const modules = await getAllQuizModules();

  if (modules.length === 0) {
    throw new Error('No quiz modules are available in the database.');
  }

  let scannedUsers = 0;
  let changedUsers = 0;
  let unresolvedProgressEntries = 0;

  const cursor = UserProgress.find({}).cursor();

  for await (const userProgress of cursor) {
    scannedUsers += 1;
    let userChanged = false;

    userProgress.quizProgress.forEach((progress) => {
      const module = findModuleForProgress(progress, modules);
      if (!module) {
        return;
      }

      const originalModuleId = progress.moduleId ? String(progress.moduleId) : null;
      const originalVersion = progress.moduleVersion || null;

      progress.moduleId = module._id;
      progress.moduleSlug = module.slug;
      progress.moduleVersion = module.version;
      progress.quizName = module.name;

      if (originalModuleId !== String(module._id) || originalVersion !== module.version) {
        userChanged = true;
      }

      const { changed: snapshotsChanged, snapshots } = ensureSnapshotsForProgress(progress, module);
      if (snapshotsChanged) {
        userChanged = true;
      }

      const answersChanged = attachSnapshotsToAnswers(
        progress,
        snapshots.length ? snapshots : progress.selectedQuestionSnapshots || []
      );

      if (answersChanged) {
        userChanged = true;
      }

      if (
        Array.isArray(progress.answers) &&
        progress.answers.length > 0 &&
        (!Array.isArray(progress.selectedQuestionSnapshots) ||
          progress.selectedQuestionSnapshots.length === 0)
      ) {
        unresolvedProgressEntries += 1;
      }
    });

    if (userChanged) {
      await userProgress.save();
      changedUsers += 1;
    }
  }

  console.log('Migration finished.');
  console.log(
    JSON.stringify(
      {
        scannedUsers,
        changedUsers,
        unresolvedProgressEntries,
      },
      null,
      2
    )
  );
};

migrate()
  .catch((error) => {
    console.error('Quiz progress migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  });
