import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BlogPostEntity } from './entities/blog-post.entity';
import { ListPublishedPostsService } from './services/list-published-posts.service';
import { GetPostBySlugService } from './services/get-post-by-slug.service';
import { ListAllPostsService } from './services/list-all-posts.service';
import { CreatePostService } from './services/create-post.service';
import { UpdatePostService } from './services/update-post.service';
import { DeletePostService } from './services/delete-post.service';
import { BlogPostSeederService } from './services/blog-post-seeder.service';
import { BlogController } from './blog.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlogPostEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'bitcommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [BlogController],
  providers: [
    ListPublishedPostsService,
    GetPostBySlugService,
    ListAllPostsService,
    CreatePostService,
    UpdatePostService,
    DeletePostService,
    BlogPostSeederService,
    JwtAuthGuard,
  ],
  exports: [ListPublishedPostsService, TypeOrmModule],
})
export class BlogModule {}
