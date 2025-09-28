import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';


export type ActivityDocument = Activity & Document;
@Schema({ timestamps: true })
export class Activity extends Document {
 @ApiProperty({ example: '665c861c8b23919a3f823fa1', type: String })
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId?: Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  action: string;

 @ApiProperty({ example: '2025-09-24T01:36:00.000Z', 
 description: 'Timestamp of when the log was created' })
  createdAt?: Date;
}


export const ActivitySchema = SchemaFactory.createForClass(Activity);

