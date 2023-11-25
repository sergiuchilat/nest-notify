import {
  Body,
  Controller, DefaultValuePipe, Delete, Get,
  HttpStatus, Param, ParseIntPipe, ParseUUIDPipe,
  Post, Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { NotificationInternalService } from './notification-internal.service';
import {
  ApiOkResponse,
  ApiOperation, ApiParam, ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import {SortOrder} from '@/database/validators/typeorm.sort.validator';
import PaginatorConfigInterface from '@/database/interfaces/paginator-config.interface';
import {NotificationCreatePayloadDto} from '@/app/modules/notification/modules/internal/dto/notification-create-payload.dto';
import {NotificationSortColumn} from '@/app/modules/notification/modules/internal/validators/message-sort-column.validator';
import {NotificationGetResponseDto} from '@/app/modules/notification/modules/internal/dto/notification-get-response.dto';

@ApiTags('Notifications Internal CRUD')
@Controller('notifications/internal')

export class NotificationInternalCrudController {
  constructor(
    private readonly messageService: NotificationInternalService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create new internal notification' })
  @ApiOkResponse({
    description: 'Created notification',
    type: NotificationCreatePayloadDto,
    isArray: true,
  })
  async create(
    @Body() notificationCreatePayloadDto: NotificationCreatePayloadDto,
    @Res() response: Response,
  ) {
    response
      .status(HttpStatus.OK)
      .send(await this.messageService.create(notificationCreatePayloadDto));
  }

  @Get('')
  @ApiOperation({ summary: 'Get list of internal notifications' })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    type: 'number',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Page size',
    type: 'number',
    required: false,
  })
  @ApiQuery({
    name: 'sort_order',
    description: 'Sort order',
    enum: SortOrder,
    required: false,
  })
  @ApiQuery({
    name: 'sort_by',
    description: 'Sort column',
    enum: NotificationSortColumn,
    required: false,
  })
  @ApiOkResponse({
    description: 'List of notifications',
    type: NotificationGetResponseDto,
    isArray: true,
  })
  async getAllPaginated(
      @Query('page', new DefaultValuePipe(1), ParseIntPipe)
        page: number,
      @Query('limit', new DefaultValuePipe(50), ParseIntPipe)
        limit: number,
      @Res() response: Response,
  ) {
    const paginatorConfig: PaginatorConfigInterface = {
      page,
      limit
    };
    response.status(HttpStatus.OK).json(
      await this.messageService.getAllPaginated(
        paginatorConfig
      ),
    );
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Get one internal notification by uuid' })
  @ApiParam({ name: 'uuid', description: 'Uuid', type: 'string'})
  @ApiOkResponse({
    description: 'Notification item',
    type: NotificationGetResponseDto,
    isArray: false,
  })
  async getOneById(
      @Param('uuid', ParseUUIDPipe) uuid: string,
      @Res() response: Response,
  ) {
    response
      .status(HttpStatus.OK)
      .send(await this.messageService.getOne(uuid));
  }

  @Delete(':uuid')
  @ApiOperation({ summary: 'Delete a notification by uuid' })
  @ApiParam({ name: 'uuid', description: 'Notification uuid', type: 'string' })
  @ApiOkResponse({
    description: 'Empty response',
    type: null,
  })
  async delete(
      @Param('uuid', ParseUUIDPipe) uuid: string,
      @Res() response: Response,
  ) {
    response
      .status(HttpStatus.OK)
      .send(await this.messageService.delete(uuid));
  }
}
