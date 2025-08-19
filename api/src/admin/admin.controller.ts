import {
    Body,
    Controller,
    Patch,
    Param,
    Post,
    UseGuards,
    Get,
    Delete,
  } from '@nestjs/common';
  import { AdminService } from './admin.service';
  import { Roles } from '../auth/decorators/roles.decorator';
  import { RolesGuard } from '../auth/guards/roles.guard';
  import { AuthGuard } from '../auth/guards/auth.guard';
  import { AddAdminDto } from '../admin/dto/add-admin.dto';
  import { CreateUserDto } from './dto/create-user.dto';
  import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBody,
  } from '@nestjs/swagger';
  
  @ApiTags('Admin')
  @ApiBearerAuth('JWT-auth') // Applies to all routes in this controller
  @Controller('admin')
  export class AdminController {
    constructor(private adminService: AdminService) {}
  
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Post('add')
    @ApiOperation({ summary: 'Add a new admin user' })
    @ApiBody({ type: AddAdminDto })
    @ApiResponse({ status: 201, description: 'Admin added successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input or user not found' })
    async addAdmin(@Body() dto: AddAdminDto) {
      return this.adminService.addAdmin(dto);
    }
  
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Patch('promote/:userId')
    @ApiOperation({ summary: 'Promote a user to investigator or admin' })
    @ApiParam({ name: 'userId', type: 'string', description: 'User ID to promote' })
    @ApiResponse({ status: 200, description: 'User promoted successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async promote(@Param('userId') userId: string) {
      return this.adminService.promoteUser(userId);
    }
  
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Patch('demote/:userId')
    @ApiOperation({ summary: 'Demote a user to general' })
    @ApiParam({ name: 'userId', type: 'string', description: 'User ID to demote' })
    @ApiResponse({ status: 200, description: 'User demoted successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async demote(@Param('userId') userId: string) {
      return this.adminService.demoteUser(userId);
    }
  
  @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Patch('promote-to-admin/:userId')
    @ApiOperation({ summary: 'Promote user to an admin' })
    @ApiParam({ name: 'userId', type: 'string', description: 'User ID to promote' })
    @ApiResponse({ status: 200, description: 'User promoted successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async promoteToAdmin(@Param('userId') userId: string) {
      return this.adminService.promoteToAdmin(userId);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Get('users')
    @ApiOperation({ summary: 'Retrieve a list of all users' })
    @ApiResponse({ status: 200, description: 'List of users retrieved successfully' })
    async getAllUsers() {
      return this.adminService.getAllUsers();
    }

       @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Delete('delete/:userId')
    @ApiOperation({ summary: 'Delete a user from the database' })
    @ApiParam({ name: 'userId', type: 'string', description: 'User ID to delete' })
    @ApiResponse({ status: 200, description: 'User deleted successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async delete(@Param('userId') userId: string) {
      return this.adminService.deleteUser(userId);
    }
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Post('user')
  @ApiOperation({ summary: 'Create a new user with a one-time password (5-digit)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async createUser(@Body() dto: CreateUserDto) {
  return this.adminService.createUser(dto);
}
  }
  