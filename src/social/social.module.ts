import { Module } from '@nestjs/common';
import { LikesModule } from './likes/likes.module';
import { SavedModule } from './saved/saved.module';
import { CommentsModule } from './comments/comments.module';
import { SharesModule } from './shares/shares.module';

@Module({
  imports: [LikesModule, SavedModule, CommentsModule, SharesModule],
})
export class SocialModule {}
