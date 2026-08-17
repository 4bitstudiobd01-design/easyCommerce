import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRoleEnum } from '../user/entities/user.entity';
import { ListPublishedPostsService } from './services/list-published-posts.service';
import { GetPostBySlugService } from './services/get-post-by-slug.service';
import { ListAllPostsService } from './services/list-all-posts.service';
import { CreatePostService } from './services/create-post.service';
import { UpdatePostService } from './services/update-post.service';
import { DeletePostService } from './services/delete-post.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';

@ApiTags('Blog')
@Controller('blog')
export class BlogController {
  constructor(
    private readonly listPublishedPostsService: ListPublishedPostsService,
    private readonly getPostBySlugService: GetPostBySlugService,
    private readonly listAllPostsService: ListAllPostsService,
    private readonly createPostService: CreatePostService,
    private readonly updatePostService: UpdatePostService,
    private readonly deletePostService: DeletePostService,
  ) {}

  // --- Public reader routes ---

  @Get('posts')
  @ApiOperation({ summary: 'List published blog posts (Public)' })
  @ApiResponse({ status: 200, description: 'Published posts, newest first' })
  async listPublished(@Query('category') category?: string) {
    return this.listPublishedPostsService.execute(category);
  }

  /**
   * Admin listing is declared before :slug so that a request for
   * /blog/posts/admin is not captured by the slug route.
   */
  @Get('posts/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List every post including drafts (Super Admin)' })
  async listAll() {
    return this.listAllPostsService.execute();
  }

  @Get('posts/:slug')
  @ApiOperation({ summary: 'Read a published post by slug (Public)' })
  @ApiResponse({ status: 404, description: 'Post not found or not published' })
  async getBySlug(@Param('slug') slug: string) {
    return this.getPostBySlugService.execute(slug);
  }

  // --- Super Admin authoring routes ---

  @Post('posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a blog post (Super Admin)' })
  async create(@Body() dto: CreateBlogPostDto) {
    return this.createPostService.execute(dto);
  }

  @Patch('posts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a blog post (Super Admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateBlogPostDto) {
    return this.updatePostService.execute(id, dto);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a blog post (Super Admin)' })
  async remove(@Param('id') id: string) {
    return this.deletePostService.execute(id);
  }
}
