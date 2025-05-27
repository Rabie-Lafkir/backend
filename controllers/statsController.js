import Session from '../models/Session.js';
import mongoose from 'mongoose';
import moment from 'moment';


/**
 * getDailySessions
 * @param {*} req 
 * @param {*} res 
 */
export const getDailySessions = async (req, res) => {
  try {
    const today = moment().endOf('day');
    const pastWeek = moment().subtract(6, 'days').startOf('day');

    const sessions = await Session.find({
      endTime: { $gte: pastWeek.toDate(), $lte: today.toDate() },
      status: 'stopped'
    });

    const sessionByDay = {};
    for (let i = 0; i < 7; i++) {
      const day = moment().subtract(i, 'days').format('YYYY-MM-DD');
      sessionByDay[day] = 0;
    }

    sessions.forEach((s) => {
      const day = moment(s.endTime).format('YYYY-MM-DD');
      if (sessionByDay[day] !== undefined) {
        sessionByDay[day] += 1;
      }
    });

    const labels = Object.keys(sessionByDay).sort();
    const data = labels.map((day) => sessionByDay[day]);

    res.json({
      labels: labels.map((d) => moment(d).format('MMM D')),
      data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch session trend' });
  }
};



/**
 * getConsoleUsageToday
 * @param {*} req 
 * @param {*} res 
 */
export const getConsoleUsageToday = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const sessions = await Session.find({
      endTime: { $gte: startOfDay, $lte: endOfDay },
      status: 'stopped'
    }).populate('console');

    const usageMap = {};
    sessions.forEach((s) => {
      const consoleName = s.console?.name || 'Unknown';
      usageMap[consoleName] = (usageMap[consoleName] || 0) + 1;
    });

    const labels = Object.keys(usageMap);
    const data = labels.map((name) => usageMap[name]);

    res.json({ labels, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch console usage chart' });
  }
};


// 📊 Daily income for the last 7 days
export const getDailyIncome = async (req, res) => {
  try {
    const today = moment().endOf('day');
    const pastWeek = moment().subtract(6, 'days').startOf('day');

    // Fetch sessions from last 7 days
    const sessions = await Session.find({
      endTime: { $gte: pastWeek.toDate(), $lte: today.toDate() },
      status: 'stopped'
    });

    // Group by day
    const incomeByDay = {};

    for (let i = 0; i < 7; i++) {
      const day = moment().subtract(i, 'days').format('YYYY-MM-DD');
      incomeByDay[day] = 0;
    }

    sessions.forEach((s) => {
      const day = moment(s.endTime).format('YYYY-MM-DD');
      if (incomeByDay[day] !== undefined) {
        incomeByDay[day] += s.totalPrice;
      }
    });

    // Format result (in date order)
    const labels = Object.keys(incomeByDay).sort();
    const data = labels.map((day) => +incomeByDay[day].toFixed(2));

    res.json({
      labels: labels.map((d) => moment(d).format('MMM D')),
      data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load daily income chart.' });
  }
};


export const getTodayStats = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch today's completed sessions
    const sessions = await Session.find({
      endTime: { $gte: startOfDay, $lte: endOfDay },
      status: 'stopped'
    }).populate('console');

    const totalIncome = sessions.reduce((sum, s) => sum + s.totalPrice, 0);
    const totalPlaytime = sessions.reduce((sum, s) => sum + s.totalMinutes, 0);
    const totalSessions = sessions.length;

    const usageCount = {};
    for (let session of sessions) {
      const consoleName = session.console?.name || 'Unknown';
      usageCount[consoleName] = (usageCount[consoleName] || 0) + 1;
    }

    let mostUsedConsole = null;
    for (let name in usageCount) {
      if (!mostUsedConsole || usageCount[name] > mostUsedConsole.count) {
        mostUsedConsole = { name, count: usageCount[name] };
      }
    }

    res.json({
      totalIncome: +totalIncome.toFixed(2),
      totalSessions,
      totalPlaytime,
      mostUsedConsole
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load dashboard stats' });
  }
};


// 🧮 Get aggregated statistics
export const getStats = async (req, res) => {
    try {
        const { startDate, endDate, consoleId } = req.query;

        const match = { status: 'stopped' };

        if (startDate) match.endTime = { ...match.endTime, $gte: new Date(startDate) };
        if (endDate) match.endTime = { ...match.endTime, $lte: new Date(endDate) };
        if (consoleId) match.console = new mongoose.Types.ObjectId(consoleId);

        const [revenueAgg, playtimeAgg, sessionCount, mostUsed] = await Promise.all([
            Session.aggregate([
                { $match: match },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ]),
            Session.aggregate([
                { $match: match },
                { $group: { _id: null, minutes: { $sum: '$totalMinutes' } } }
            ]),
            Session.countDocuments(match),
            Session.aggregate([
                { $match: match },
                { $group: { _id: '$console', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 3 },
                {
                    $lookup: {
                        from: 'consoles',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'console'
                    }
                },
                { $unwind: '$console' },
                {
                    $project: {
                        name: '$console.name',
                        count: 1
                    }
                }
            ])
        ]);

        res.json({
            revenue: revenueAgg[0]?.total || 0,
            totalPlaytime: playtimeAgg[0]?.minutes || 0,
            totalSessions: sessionCount,
            topConsoles: mostUsed
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to load statistics', error: err.message });
    }
};


// 📊 Session Type Breakdown
export const getSessionTypeBreakdown = async (req, res) => {
  try {
    const startOfDay = moment().startOf('day').toDate();
    const endOfDay = moment().endOf('day').toDate();

    const sessions = await Session.find({
      endTime: { $gte: startOfDay, $lte: endOfDay },
      status: 'stopped'
    });

    const counts = { planned: 0, unplanned: 0 };
    sessions.forEach(s => {
      if (s.type === 'planned') counts.planned += 1;
      else if (s.type === 'unplanned') counts.unplanned += 1;
    });

    res.json({
      labels: ['Planned', 'Unplanned'],
      data: [counts.planned, counts.unplanned]
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load session type breakdown' });
  }
};


// 🕰️ Hourly Activity Today
export const getHourlyActivity = async (req, res) => {
  try {
    const start = moment().startOf('day').toDate();
    const end = moment().endOf('day').toDate();

    const sessions = await Session.find({
      endTime: { $gte: start, $lte: end },
      status: 'stopped'
    });

    const hourlyMap = Array(24).fill(0); // 0 to 23 hours

    sessions.forEach(s => {
      const hour = moment(s.endTime).hour();
      hourlyMap[hour]++;
    });

    res.json({
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      data: hourlyMap
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load hourly activity' });
  }
};



// 📊 Reusable function
async function getRevenueStats(sinceDate) {
    const result = await Session.aggregate([
        { $match: { status: 'stopped', endTime: { $gte: sinceDate } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    return result[0]?.total || 0;
}


