import mongoose, { isValidObjectId } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function asHttpError(message: string, status: number) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function normalizeActivityType(type: unknown) {
  if (typeof type !== 'string') return '';
  return type.trim();
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') throw asHttpError('Activity payload is required', 400);
  const { userId, teamId, type, minutes } = input as Record<string, unknown>;

  if (!isValidObjectId(userId) || !isValidObjectId(teamId)) {
    throw asHttpError('Valid userId and teamId are required', 400);
  }

  const user = await User.findById(userId);
  const team = await Team.findById(teamId);

  if (!user || !team) {
    throw asHttpError('User and team must already exist', 400);
  }

  const normalizedType = normalizeActivityType(type);
  if (!normalizedType) {
    throw asHttpError('Activity type is required', 400);
  }

  const amount = Number(minutes);
  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
    throw asHttpError('Minutes must be a positive integer', 400);
  }

  try {
    const activity = await Activity.create({
      user: user._id,
      team: team._id,
      type: normalizedType,
      minutes: amount,
      points: Math.max(1, amount),
      occurredAt: new Date(),
    });
    return activity.toObject();
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      throw asHttpError(error.message, 400);
    }
    throw error;
  }
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') throw asHttpError('Team payload is required', 400);

  const { name, mascot, members } = input as Record<string, unknown>;
  const teamName = typeof name === 'string' ? name.trim() : '';
  const teamMascot = typeof mascot === 'string' ? mascot.trim() : '';

  if (!teamName) {
    throw asHttpError('Team name is required', 400);
  }
  if (!teamMascot) {
    throw asHttpError('Team mascot is required', 400);
  }

  const normalizedMembers = Array.isArray(members)
    ? members.map((member) => String(member)).filter((member) => member.length > 0)
    : [];

  for (const memberId of normalizedMembers) {
    if (!isValidObjectId(memberId)) {
      throw asHttpError('Member IDs must be valid ObjectIds', 400);
    }
  }

  try {
    const team = await Team.create({
      name: teamName,
      mascot: teamMascot,
      members: normalizedMembers,
    });
    return team.toObject();
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      throw asHttpError(error.message, 400);
    }
    throw error;
  }
}

export async function getLeaderboard() {
  const rows = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'teamInfo' } },
    { $unwind: '$teamInfo' },
    { $project: { _id: 0, teamId: '$_id', teamName: '$teamInfo.name', totalPoints: 1 } },
  ]);

  return rows.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

function inferFocusFromType(type: string | undefined) {
  const normalized = (type ?? '').toLowerCase();
  if (normalized.includes('run') || normalized.includes('cycle') || normalized.includes('swim') || normalized.includes('walk')) return 'endurance';
  if (normalized.includes('strength') || normalized.includes('lift') || normalized.includes('push') || normalized.includes('pull')) return 'strength';
  if (normalized.includes('mobility') || normalized.includes('stretch') || normalized.includes('yoga')) return 'mobility';
  return 'endurance';
}

export async function suggestWorkouts(userEmail: string) {
  const email = typeof userEmail === 'string' ? userEmail.trim().toLowerCase() : '';
  if (!email) {
    throw asHttpError('User email is required', 400);
  }

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw asHttpError('User not found', 404);
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const preferredFocus = String(user.fitnessGoal ?? '').trim() || inferFocusFromType(recentActivities[0]?.type ?? '');
  const workouts = await Workout.find({ focus: preferredFocus }).lean();
  const suggestions = workouts.length > 0 ? workouts : await Workout.find().lean();

  return suggestions.map((workout) => ({
    ...workout,
    reason: `Your ${String(user.fitnessGoal ?? 'activity').toLowerCase()} goal and recent ${recentActivities[0]?.type ?? 'activity'} pattern suggest this ${String(workout.focus).toLowerCase()} workout.`,
  }));
}

export { User };
