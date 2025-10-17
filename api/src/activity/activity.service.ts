import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model,Types } from 'mongoose';
import { Activity, ActivityDocument } from './activity.schema';

@Injectable()
export class ActivityService {
  constructor(@InjectModel(Activity.name) private activityModel: Model<Activity>) {}

async logActivity(userId: Types.ObjectId | string | null, action: string): Promise<void> {
  try {
    const objectId =
      typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    const activity = new this.activityModel({
      userId: objectId,
      action,
      createdAt: new Date(),
    });

    await activity.save();
    console.log('Activity saved:', { userId: objectId, action });
  } catch (error) {
    console.error('Error logging activity:', error.message);
    throw error;
  }
}


  async getUserActivity(userId: string) {
    const objectId = new Types.ObjectId(userId); // Convert to ObjectId
    const activities = await this.activityModel
      .find({ userId: objectId })
      .sort({ createdAt: -1 });

    return activities.map(activity => ({
      action: activity.action,
      createdAt: activity.createdAt?.toLocaleString('en-ZA', {
        timeZone: 'Africa/Johannesburg',
      }),
    }));
  }

  async getAllActivities() {
    return this.activityModel.find().sort({ createdAt: -1 }).populate('userId', 'username email');
  }
}