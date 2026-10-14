import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('user_blocks')
export class UserBlock {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  blockerId!: string;

  @Column({ type: 'uuid' })
  blockedId!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  static create(
    id: string | undefined,
    blockerId: string,
    blockedId: string,
  ): UserBlock {
    if (blockerId === blockedId) {
      throw new Error('User cannot block themselves');
    }
    const block = new UserBlock();
    if (id) {
      block.id = id;
    }
    block.blockerId = blockerId;
    block.blockedId = blockedId;
    return block;
  }
}
