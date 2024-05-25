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
  HasOne,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Origen from "./Origen";
import Company from "./Company";
import Whatsapp from "./Whatsapp";
import Contact from "./Contact";

@Table
class Exam extends Model<Exam> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;
  
  @Column
  patientId: string;
  
  @Column
  name: string;

  @Column
  dateExam: string;

  @Column
  description: string;

  @Column
  modality: string;

  @Column
  accessionNumber: string;

  @ForeignKey(() => Origen)
  @Column
  origensId: number;

  @Column
  radiologista: string;

  @Column
  type: string;

  @Column
  dataJson: string;
  
  @Column
  ocorrencia: number;

  @Column
  nextSend: Date;

  @Column
  response: string;

  @Column
  status: string;

  @Column
  situation: string;

  @ForeignKey(() => Whatsapp)
  @Column
  whatsappId: number;
  
  @BelongsTo(() => Whatsapp)
  whatsapp: Whatsapp
  
  @ForeignKey(() => Company)
  @Column
  companyId: number;
  
  @BelongsTo(() => Company)
  company: Company

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact
  
  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Origen)
  origen: Origen;
}

export default Exam;
