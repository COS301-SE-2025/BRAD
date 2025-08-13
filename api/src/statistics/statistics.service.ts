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

async getPendingReportsCount(userid:string, role:string): Promise<number> {
    if(role==='admin' || role==='investigator') {
        return this.reportModel.countDocuments({ analyzed: false });
    }
    if(role==='general') {
        return this.reportModel.countDocuments({ userId: userid, analyzed: false });
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
        _id: '$domain',        // group by domain
        count: { $sum: 1 }      // count how many times it appears
      }
    },
    {
      $match: {
        count: { $gt: 1 }       // keep only those with more than 1 occurrence
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
      $sort: { count: -1 }      // optional: sort by count descending
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
    return this.reportModel.countDocuments({ investigatorDecision: 'safe' });
  }
async getReportCountByMonth(role: string, month: number): Promise<{ month: number; count: number }> {
  if (role !== 'admin' && role !== 'investigator') {
    throw new ForbiddenException('Role not permitted to view statistics');
  }

  if (month < 1 || month > 12) {
    throw new BadRequestException('Invalid month. Must be between 1 and 12.');
  }

  const result = await this.reportModel.aggregate([
    {
      $addFields: {
        reportMonth: { $month: '$createdAt' }
      }
    },
    {
      $match: {
        reportMonth: month
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
    }
  ]);

  return result[0] || { month, count: 0 };
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
}
