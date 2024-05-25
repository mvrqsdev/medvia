import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Unique,
  Default,
  HasMany,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Contact from "./Contact";

@Table
class Origen extends Model<Origen> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Unique
  @Column
  name: string;

  @Column
  type: string;

  @Column
  groupTeams: string;

  @Column
  priority: string;

  @Column
  observation: string;

  @Column
  frequency: number;

  @Column
  interval: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => Contact)
  contacts: Contact[];
}

export default Origen;
