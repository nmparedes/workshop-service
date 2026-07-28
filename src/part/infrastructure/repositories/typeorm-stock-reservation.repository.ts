import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { StockReservation } from "../../domain/entities/stock-reservation.entity";
import { StockReservationRepository } from "../../domain/repositories/stock-reservation.repository.interface";
import { StockReservationMapper } from "../mappers/stock-reservation.mapper";
import { StockReservationOrmEntity } from "../typeorm/stock-reservation.orm-entity";

@Injectable()
export class TypeOrmStockReservationRepository implements StockReservationRepository {
  constructor(
    @InjectRepository(StockReservationOrmEntity)
    private readonly repository: Repository<StockReservationOrmEntity>,
  ) {}

  async save(reservation: StockReservation): Promise<StockReservation> {
    const savedEntity = await this.repository.save(
      StockReservationMapper.toOrmEntity(reservation),
    );
    return StockReservationMapper.toDomain(savedEntity);
  }

  async findBySagaIdOrderIdPartId(
    sagaId: string,
    orderId: string,
    partId: string,
  ): Promise<StockReservation | null> {
    const ormEntity = await this.repository.findOne({
      where: {
        saga_id: sagaId.trim(),
        order_id: orderId.trim(),
        part_id: partId.trim(),
      },
    });

    return ormEntity ? StockReservationMapper.toDomain(ormEntity) : null;
  }
}
