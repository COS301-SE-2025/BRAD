import { Injectable ,ForbiddenException,BadRequestException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';


@Injectable()
export class StatisticsService {

    constructor(@InjectModel('Report') private reportModel: Model<any>, @InjectModel('User') private userModel: Model<any>) {}

    async getTotalReports(userid:string, role:string):Promise<number>{
        if(role==='admin' || role==='investigator') {
        return this.reportModel.countDocuments();
    }
    if(role==='general') {
        return this.reportModel.countDocuments({ userId: userid });
    }
throw new ForbiddenException('Role not permitted to view statistics');
}

async getPendingReportsCount(userid: string, role: string): Promise<number> {
  if (role === 'admin' || role === 'investigator') {
    return this.reportModel.countDocuments({ investigatorDecision: null, reviewedBy: null, analysisStatus: 'pending'  });
  }
  if (role === 'general') {
    return this.reportModel.countDocuments({ userId: userid, investigatorDecision: null, reviewedBy: null, analysisStatus: 'pending' });
  }
  throw new ForbiddenException('Role not permitted to view statistics');
}

async getInProgressReportsCount(userid: string, role: string): Promise<number> {
  if (role === 'admin' || role === 'investigator') {
    return this.reportModel.countDocuments({ investigatorDecision: null, reviewedBy: { $ne: null }, analysisStatus: 'in-progress' });
  }
  if (role === 'general') {
    return this.reportModel.countDocuments({ userId: userid, investigatorDecision: null, reviewedBy: { $ne: null }, analysisStatus: 'in-progress' });
  }
  throw new ForbiddenException('Role not permitted to view statistics');
}

async getResolvedReportsCount(userid: string, role: string): Promise<number> {
  if (role === 'admin' || role === 'investigator') {
    return this.reportModel.countDocuments({ investigatorDecision: { $ne: null }, reviewedBy: { $ne: null }, analysisStatus: 'done' });
  }
  if (role === 'general') {
    return this.reportModel.countDocuments({ userId: userid, investigatorDecision: { $ne: null }, reviewedBy: { $ne: null }, analysisStatus: 'done' });
  }
  throw new ForbiddenException('Role not permitted to view statistics');
}


  async getAnalyzedReportsCount(userid:string, role:string): Promise<number> {
    if(role==='admin' || role==='investigator') {
        return this.reportModel.countDocuments({ analyzed: true });
    }
    if(role==='general') {
        return this.reportModel.countDocuments({ userId: userid, analyzed: true });
    }
    throw new ForbiddenException('Role not permitted to view statistics');
  }
async getDomainsReportedMoreThanOnce(): Promise<{ domain: string; count: number }[]> {
  const results = await this.reportModel.aggregate([
    {
      $group: {
        _id: '$domain',        
        count: { $sum: 1 }     
      }
    },
    {
      $match: {
        count: { $gt: 1 }       
      }
    },
    {
      $project: {
        _id: 0,
        domain: '$_id',
        count: 1
      }
    },
    {
      $sort: { count: -1 }     
    }
  ]);

  return results;
}


  async getReportsMarkedAsMalicious(role:string): Promise<number> {
    if(role !== 'admin' && role !== 'investigator') {
      throw new ForbiddenException('Role not permitted to view statistics');
    }
    return this.reportModel.countDocuments({ investigatorDecision: 'malicious' });
  }
  async getReportsMarkedAsSafe(role:string): Promise<number> {
    if(role !== 'admin' && role !== 'investigator') {
      throw new ForbiddenException('Role not permitted to view statistics');
    }
    return this.reportModel.countDocuments({ investigatorDecision: 'benign' });
  }
async getReportsByYear(role: string): Promise<{ month: number; count: number }[]> {
  if (role !== 'admin' && role !== 'investigator') {
    throw new ForbiddenException('Role not permitted to view statistics');
  }

  const result = await this.reportModel.aggregate([
    {
      $addFields: {
        reportMonth: { $month: { date: '$createdAt' } }
      }
    },
    {
      $group: {
        _id: '$reportMonth',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        month: '$_id',
        count: 1
      }
    },
    {
      $sort: { month: 1 }
    }
  ]);

  const monthsData = Array.from({ length: 12 }, (_, i) => {
    const found = result.find(r => r.month === i + 1);
    return { month: i + 1, count: found ? found.count : 0 };
  });

  return monthsData;
}

async getReportsByWeek(role: string): Promise<{ week: number; count: number }[]> {
  if (role !== 'admin' && role !== 'investigator') {
    throw new ForbiddenException('Role not permitted to view statistics');
  }

  const result = await this.reportModel.aggregate([
    {
      $addFields: {
      
        reportWeek: { $isoWeek: '$createdAt' }
      }
    },
    {
      $group: {
        _id: '$reportWeek',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        week: '$_id',
        count: 1
      }
    },
    {
      $sort: { week: 1 }
    }
  ]);
  
  const weeksData = Array.from({ length: 52 }, (_, i) => {
    const found = result.find(r => r.week === i + 1);
    return { week: i + 1, count: found ? found.count : 0 };
  });

  return weeksData;
}

async getReportsByDay (role:string): Promise<{ day: number; count: number }[]> {
  if (role !== 'admin' && role !== 'investigator') {
    throw new ForbiddenException('Role not permitted to view statistics');
  }
const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

  const result = await this.reportModel.aggregate([
    {
      $addFields: {
        reportMonth: { $month: '$createdAt' },
      reportYear: { $year: '$createdAt' },
      reportDay: { $dayOfMonth: '$createdAt' }
      }
    },
    {
       $match: {
      reportMonth: currentMonth,
      reportYear: currentYear
    }
    },
    {
      $group: {
        _id: '$reportDay',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        day: '$_id',
        count: 1
      }
    },
    {
      $sort: { day: 1 }
    }
  ]);

  const daysData = Array.from({ length: 31 }, (_, i) => {
    const found = result.find(r => r.day === i + 1);
    return { day: i + 1, count: found ? found.count : 0 };
  });

  return daysData;
}

async getReportSubmittedToday(role:string): Promise<number> {
    if(role !== 'admin' && role !== 'investigator') {
      throw new ForbiddenException('Role not permitted to view statistics');
    }
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    return this.reportModel.countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
  }

async getNoOfInvestigators(role:string): Promise<number> {
    if(role !== 'admin') {
      throw new ForbiddenException('Role not permitted to view statistics');
    }
    // Assuming you have a User model with a role field
    return this.userModel.countDocuments({ role: 'investigator' });
  }

  async getNoOfAdmins(role:string): Promise<number> {
    if(role !== 'admin') {
      throw new ForbiddenException('Role not permitted to view statistics');
    }
    // Assuming you have a User model with a role field
    return this.userModel.countDocuments({ role: 'admin' });
  }
  async getNoOfGeneralUsers(role:string): Promise<number> {
    if(role !== 'admin') {
      throw new ForbiddenException('Role not permitted to view statistics');
    }
    // Assuming you have a User model with a role field
    return this.userModel.countDocuments({ role: 'general' });
  }

  async getAvgBotAnalysisTime(role: string): Promise<string> {
    if (role !== 'admin') throw new ForbiddenException('Admins only');
    const reports = await this.reportModel.find(
      { 'scrapingInfo.summary.startTime': { $ne: null }, 'scrapingInfo.summary.endTime': { $ne: null } },
      { 'scrapingInfo.summary.startTime': 1, 'scrapingInfo.summary.endTime': 1 }
    );

    if (!reports.length) return '0s';
    const totalMs = reports.reduce((sum, r) => {
      const start = new Date(r.scrapingInfo.summary.startTime).getTime();
      const end = new Date(r.scrapingInfo.summary.endTime).getTime();
      return sum + (end - start);
    }, 0);

    return this.formatDuration(totalMs / reports.length);
  }

  async getAvgInvestigatorTime(role: string): Promise<string> {
    if (role !== 'admin') throw new ForbiddenException('Admins only');
    const reports = await this.reportModel.find(
      { 'scrapingInfo.summary.endTime': { $ne: null }, 'updatedAt': { $ne: null } },
      { 'scrapingInfo.summary.endTime': 1, 'updatedAt': 1 }
      
    );

    if (!reports.length) return '0s';
    const totalMs = reports.reduce((sum, r) => {
      const start = new Date(r.scrapingInfo.summary.endTime).getTime();
      const end = new Date(r.updatedAt).getTime();
      return sum + (end - start);
    }, 0);

    return this.formatDuration(totalMs / reports.length);
  }

  async getAvgResolutionTime(role: string): Promise<string> {
    if (role !== 'admin') throw new ForbiddenException('Admins only');
    const reports = await this.reportModel.find(
      { 'createdAt': { $ne: null }, 'updatedAt': { $ne: null } },
      { 'createdAt': 1, 'updatedAt': 1 }
    );

    if (!reports.length) return '0s';
    const totalMs = reports.reduce((sum, r) => {
      const start = new Date(r.createdAt).getTime();
      const end = new Date(r.updatedAt).getTime();
      return sum + (end - start);
    }, 0);

    return this.formatDuration(totalMs / reports.length);
  }

  async getInvestigatorStats(role: string): Promise<any[]> {
    if (role !== 'admin') throw new ForbiddenException('Admins only');
    const reports = await this.reportModel.find(
      { reviewedBy: { $ne: null }, updatedAt: { $ne: null } },
      { reviewedBy: 1, investigatorDecision: 1, updatedAt: 1, 'scrapingInfo.summary.endTime': 1 }
    );

    if (!reports.length) return [];

    const grouped: Record<string, any> = {};
    for (const r of reports) {
      const inv = r.reviewedBy.toString();
      if (!grouped[inv]) {
        grouped[inv] = { resolved: 0, malicious: 0, safe: 0, totalTime: 0 };
      }
      grouped[inv].resolved++;
      if (r.investigatorDecision === 'malicious') grouped[inv].malicious++;
      if (r.investigatorDecision === 'benign') grouped[inv].safe++;

      if (r.scrapingInfo?.summary?.endTime) {
        const start = new Date(r.scrapingInfo.summary.endTime).getTime();
        const end = new Date(r.updatedAt).getTime();
        grouped[inv].totalTime += (end - start);
      }
    }

    // Resolve usernames
    const userIds = Object.keys(grouped);
    const users = await this.userModel.find({ _id: { $in: userIds } }, { username: 1 });

    return userIds.map((id) => {
      const stats = grouped[id];
      const user = users.find((u) => u._id.toString() === id);
      const maliciousPct = stats.resolved ? Math.round((stats.malicious / stats.resolved) * 100) : 0;
      const safePct = stats.resolved ? Math.round((stats.safe / stats.resolved) * 100) : 0;
      return {
        name: user?.username || 'Unknown',
        resolved: stats.resolved,
        malicious: maliciousPct,
        safe: safePct,
        avgTime: this.formatDuration(stats.totalTime / stats.resolved),
      };
    });
  }

  private formatDuration(ms: number): string {
    if (!ms) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}
