import { PartCodeInvalidException } from "../exceptions/part-code-invalid.exception";

export class PartCode {
  private constructor(private readonly value: string) {}

  static create(value: string): PartCode {
    if (!value || typeof value !== "string") {
      throw new PartCodeInvalidException(
        String(value),
        "Code must be a non-empty string.",
      );
    }

    const normalizedValue = value.trim().toUpperCase();
    if (!this.isValid(normalizedValue)) {
      throw new PartCodeInvalidException(
        value,
        "Code must follow the ABC-001 format: 2 to 5 uppercase letters, a hyphen and 3 to 6 digits.",
      );
    }

    return new PartCode(normalizedValue);
  }

  static isValid(value: string): boolean {
    if (!value || typeof value !== "string") {
      return false;
    }

    return /^[A-Z]{2,5}-\d{3,6}$/.test(value.trim().toUpperCase());
  }

  get rawValue(): string {
    return this.value;
  }

  format(): string {
    return this.value;
  }

  equals(other: PartCode | null | undefined): boolean {
    return Boolean(other && this.value === other.value);
  }

  toString(): string {
    return this.value;
  }
}
