import { randomUUID } from "node:crypto";
import { DomainException } from "../../../common/exceptions/domain.exception";
import { EstimatedTimeInvalidException } from "../exceptions/estimated-time-invalid.exception";
import { PriceInvalidException } from "../exceptions/price-invalid.exception";

export interface CreateServiceCatalogItemProps {
  name: string;
  description?: string;
  price: number;
  estimatedMinutes: number;
}

export interface UpdateServiceCatalogItemProps {
  name?: string;
  description?: string;
  price?: number;
  estimatedMinutes?: number;
}

interface ServiceCatalogItemProps extends CreateServiceCatalogItemProps {
  id?: string;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ServiceCatalogItem {
  private readonly itemId: string;
  private itemName: string;
  private itemDescription: string;
  private itemPrice: number;
  private itemEstimatedMinutes: number;
  private itemActive: boolean;
  private readonly itemCreatedAt: Date;
  private itemUpdatedAt: Date;

  private constructor(props: ServiceCatalogItemProps) {
    this.itemId = props.id ?? randomUUID();
    this.itemName = props.name;
    this.itemDescription = props.description ?? "";
    this.itemPrice = props.price;
    this.itemEstimatedMinutes = props.estimatedMinutes;
    this.itemActive = props.active ?? true;
    this.itemCreatedAt = props.createdAt ?? new Date();
    this.itemUpdatedAt = props.updatedAt ?? new Date();

    this.validate();
  }

  static create(props: ServiceCatalogItemProps): ServiceCatalogItem {
    return new ServiceCatalogItem(props);
  }

  update(props: UpdateServiceCatalogItemProps): void {
    if (props.name !== undefined) {
      this.validateName(props.name);
      this.itemName = props.name;
    }

    if (props.description !== undefined) {
      this.validateDescription(props.description);
      this.itemDescription = props.description;
    }

    if (props.price !== undefined) {
      this.validatePrice(props.price);
      this.itemPrice = props.price;
    }

    if (props.estimatedMinutes !== undefined) {
      this.validateEstimatedMinutes(props.estimatedMinutes);
      this.itemEstimatedMinutes = props.estimatedMinutes;
    }

    this.itemUpdatedAt = new Date();
  }

  activate(): void {
    this.itemActive = true;
    this.itemUpdatedAt = new Date();
  }

  deactivate(): void {
    this.itemActive = false;
    this.itemUpdatedAt = new Date();
  }

  calculateDiscountedPrice(discountPercent: number): number {
    if (discountPercent < 0 || discountPercent > 100) {
      throw new DomainException(
        "DISCOUNT_INVALID",
        "Discount percent must be between 0 and 100.",
        { discountPercent },
      );
    }

    const discount = this.itemPrice * (discountPercent / 100);
    return Number((this.itemPrice - discount).toFixed(2));
  }

  private validate(): void {
    this.validateName(this.itemName);
    this.validateDescription(this.itemDescription);
    this.validatePrice(this.itemPrice);
    this.validateEstimatedMinutes(this.itemEstimatedMinutes);
  }

  private validateName(name: string): void {
    if (!name?.trim()) {
      throw new DomainException(
        "SERVICE_CATALOG_NAME_REQUIRED",
        "Name is required.",
      );
    }
    if (name.trim().length < 3) {
      throw new DomainException(
        "SERVICE_CATALOG_NAME_INVALID",
        "Name must have at least 3 characters.",
      );
    }
    if (name.trim().length > 100) {
      throw new DomainException(
        "SERVICE_CATALOG_NAME_INVALID",
        "Name must have at most 100 characters.",
      );
    }
  }

  private validateDescription(description: string): void {
    if (description.length > 500) {
      throw new DomainException(
        "SERVICE_CATALOG_DESCRIPTION_INVALID",
        "Description must have at most 500 characters.",
      );
    }
  }

  private validatePrice(price: number): void {
    if (price <= 0 || price < 0.01) {
      throw new PriceInvalidException(price);
    }
  }

  private validateEstimatedMinutes(estimatedMinutes: number): void {
    if (estimatedMinutes <= 0) {
      throw new EstimatedTimeInvalidException(estimatedMinutes);
    }
  }

  get id(): string {
    return this.itemId;
  }

  get name(): string {
    return this.itemName;
  }

  get description(): string {
    return this.itemDescription;
  }

  get price(): number {
    return this.itemPrice;
  }

  get estimatedMinutes(): number {
    return this.itemEstimatedMinutes;
  }

  get active(): boolean {
    return this.itemActive;
  }

  get createdAt(): Date {
    return this.itemCreatedAt;
  }

  get updatedAt(): Date {
    return this.itemUpdatedAt;
  }
}
