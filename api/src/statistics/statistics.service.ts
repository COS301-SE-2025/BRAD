import { Injectable ,ForbiddenException} from '@nestjs/common';
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
  async getMostReportedDomain(): Promise<string | null> {
    const result = await this.reportModel.aggregate([
      { $group: { _id: '$domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    return result.length > 0 ? result[0]._id : null;
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
async getReportSubmittedMonthly(role:string): Promise<any[]> {
    if(role !== 'admin' && role !== 'investigator') {
      throw new ForbiddenException('Role not permitted to view statistics');
    }
    return this.reportModel.aggregate([
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          month: '$_id',
          count: 1,
          _id: 0
        }
      },
      { $sort: { month: 1 } }
    ]);
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
