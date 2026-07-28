import { randomUUID } from "node:crypto";
import { DomainException } from "../../../common/exceptions/domain.exception";
import { InsufficientReservedStockException } from "../exceptions/insufficient-reserved-stock.exception";
import { InsufficientStockException } from "../exceptions/insufficient-stock.exception";
import { QuantityInvalidException } from "../exceptions/quantity-invalid.exception";
import { PartCode } from "../value-objects/part-code.vo";

export interface CreatePartProps {
  code: string;
  name: string;
  description?: string;
  unitPrice: number;
  availableQuantity: number;
  minimumQuantity: number;
  unit: string;
}

export interface UpdatePartProps {
  name?: string;
  description?: string;
  unitPrice?: number;
  minimumQuantity?: number;
  unit?: string;
}

interface PartProps extends CreatePartProps {
  id?: string;
  reservedQuantity?: number;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Part {
  private readonly partId: string;
  private readonly partCode: PartCode;
  private partName: string;
  private partDescription: string;
  private partUnitPrice: number;
  private partAvailableQuantity: number;
  private partReservedQuantity: number;
  private partMinimumQuantity: number;
  private partUnit: string;
  private partActive: boolean;
  private readonly partCreatedAt: Date;
  private partUpdatedAt: Date;

  private constructor(props: PartProps) {
    this.partId = props.id ?? randomUUID();
    this.partCode = PartCode.create(props.code);
    this.partName = props.name;
    this.partDescription = props.description ?? "";
    this.partUnitPrice = props.unitPrice;
    this.partAvailableQuantity = props.availableQuantity;
    this.partReservedQuantity = props.reservedQuantity ?? 0;
    this.partMinimumQuantity = props.minimumQuantity;
    this.partUnit = props.unit;
    this.partActive = props.active ?? true;
    this.partCreatedAt = props.createdAt ?? new Date();
    this.partUpdatedAt = props.updatedAt ?? new Date();

    this.validate();
  }

  static create(props: PartProps): Part {
    return new Part(props);
  }

  update(props: UpdatePartProps): void {
    if (props.name !== undefined) {
      this.validateName(props.name);
      this.partName = props.name;
    }

    if (props.description !== undefined) {
      this.validateDescription(props.description);
      this.partDescription = props.description;
    }

    if (props.unitPrice !== undefined) {
      this.validateUnitPrice(props.unitPrice);
      this.partUnitPrice = props.unitPrice;
    }

    if (props.minimumQuantity !== undefined) {
      this.validateMinimumQuantity(props.minimumQuantity);
      this.partMinimumQuantity = props.minimumQuantity;
    }

    if (props.unit !== undefined) {
      this.validateUnit(props.unit);
      this.partUnit = props.unit;
    }

    this.partUpdatedAt = new Date();
  }

  activate(): void {
    this.partActive = true;
    this.partUpdatedAt = new Date();
  }

  deactivate(): void {
    this.partActive = false;
    this.partUpdatedAt = new Date();
  }

  addStock(quantity: number): void {
    this.validateMovementQuantity(quantity);
    this.partAvailableQuantity += quantity;
    this.partUpdatedAt = new Date();
  }

  removeStock(quantity: number): void {
    this.validateMovementQuantity(quantity);
    this.ensureAvailableStock(quantity);
    this.partAvailableQuantity -= quantity;
    this.partUpdatedAt = new Date();
  }

  reserveStock(quantity: number): void {
    this.validateMovementQuantity(quantity);
    this.ensureAvailableStock(quantity);
    this.partAvailableQuantity -= quantity;
    this.partReservedQuantity += quantity;
    this.partUpdatedAt = new Date();
  }

  releaseStock(quantity: number): void {
    this.validateMovementQuantity(quantity);
    this.ensureReservedStock(quantity);
    this.partReservedQuantity -= quantity;
    this.partAvailableQuantity += quantity;
    this.partUpdatedAt = new Date();
  }

  commitReservedStock(quantity: number): void {
    this.validateMovementQuantity(quantity);
    this.ensureReservedStock(quantity);
    this.partReservedQuantity -= quantity;
    this.partUpdatedAt = new Date();
  }

  private validate(): void {
    this.validateName(this.partName);
    this.validateDescription(this.partDescription);
    this.validateUnitPrice(this.partUnitPrice);
    this.validateAvailableQuantity(this.partAvailableQuantity);
    this.validateReservedQuantity(this.partReservedQuantity);
    this.validateMinimumQuantity(this.partMinimumQuantity);
    this.validateUnit(this.partUnit);
  }

  private validateName(name: string): void {
    if (!name?.trim()) {
      throw new DomainException("PART_NAME_REQUIRED", "Name is required.");
    }
    if (name.trim().length < 3) {
      throw new DomainException(
        "PART_NAME_INVALID",
        "Name must have at least 3 characters.",
      );
    }
    if (name.trim().length > 100) {
      throw new DomainException(
        "PART_NAME_INVALID",
        "Name must have at most 100 characters.",
      );
    }
  }

  private validateDescription(description: string): void {
    if (description.length > 500) {
      throw new DomainException(
        "PART_DESCRIPTION_INVALID",
        "Description must have at most 500 characters.",
      );
    }
  }

  private validateUnitPrice(unitPrice: number): void {
    if (unitPrice <= 0 || unitPrice < 0.01) {
      throw new DomainException(
        "PART_UNIT_PRICE_INVALID",
        "Unit price must be at least 0.01.",
        { unitPrice },
      );
    }
  }

  private validateAvailableQuantity(quantity: number): void {
    if (quantity < 0) {
      throw new QuantityInvalidException(
        quantity,
        "Available quantity cannot be negative.",
      );
    }
  }

  private validateReservedQuantity(quantity: number): void {
    if (quantity < 0) {
      throw new QuantityInvalidException(
        quantity,
        "Reserved quantity cannot be negative.",
      );
    }
  }

  private validateMinimumQuantity(quantity: number): void {
    if (quantity < 0) {
      throw new QuantityInvalidException(
        quantity,
        "Minimum quantity cannot be negative.",
      );
    }
  }

  private validateUnit(unit: string): void {
    if (!unit?.trim()) {
      throw new DomainException("PART_UNIT_REQUIRED", "Unit is required.");
    }
  }

  private validateMovementQuantity(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new QuantityInvalidException(
        quantity,
        "Quantity must be a positive integer.",
      );
    }
  }

  private ensureAvailableStock(quantity: number): void {
    if (this.partAvailableQuantity < quantity) {
      throw new InsufficientStockException(
        this.partAvailableQuantity,
        quantity,
      );
    }
  }

  private ensureReservedStock(quantity: number): void {
    if (this.partReservedQuantity < quantity) {
      throw new InsufficientReservedStockException(
        this.partReservedQuantity,
        quantity,
      );
    }
  }

  get id(): string {
    return this.partId;
  }

  get code(): PartCode {
    return this.partCode;
  }

  get name(): string {
    return this.partName;
  }

  get description(): string {
    return this.partDescription;
  }

  get unitPrice(): number {
    return this.partUnitPrice;
  }

  get availableQuantity(): number {
    return this.partAvailableQuantity;
  }

  get reservedQuantity(): number {
    return this.partReservedQuantity;
  }

  get minimumQuantity(): number {
    return this.partMinimumQuantity;
  }

  get totalQuantity(): number {
    return this.partAvailableQuantity + this.partReservedQuantity;
  }

  get unit(): string {
    return this.partUnit;
  }

  get active(): boolean {
    return this.partActive;
  }

  get createdAt(): Date {
    return this.partCreatedAt;
  }

  get updatedAt(): Date {
    return this.partUpdatedAt;
  }

  get belowMinimumStock(): boolean {
    return this.partAvailableQuantity < this.partMinimumQuantity;
  }

  get hasAvailableStock(): boolean {
    return this.partAvailableQuantity > 0;
  }
}
