import { BadRequestException } from "@nestjs/common";
import { HttpException } from "@nestjs/common";
import { DomainException } from "../../src/common/exceptions/domain.exception";
import { DomainExceptionFilter } from "../../src/common/filters/domain-exception.filter";
import { HttpExceptionFilter } from "../../src/common/filters/http-exception.filter";

describe("DomainExceptionFilter", () => {
  it("maps domain exceptions to structured responses", () => {
    const response = createResponse();
    const host = createHost(response);
    const filter = new DomainExceptionFilter();

    filter.catch(
      new DomainException(
        "WORKSHOP_RESOURCE_NOT_FOUND",
        "Workshop resource was not found.",
        {
          resourceId: "1",
        },
      ),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "WORKSHOP_RESOURCE_NOT_FOUND",
        message: "Workshop resource was not found.",
        correlationId: "correlation-1",
      }),
    );
  });

  it("maps conflicts and validation errors", () => {
    const filter = new DomainExceptionFilter();

    expectMapStatus(filter, "WORKSHOP_RESOURCE_ALREADY_EXISTS", 409);
    expectMapStatus(filter, "WORKSHOP_RESOURCE_CONFLICT", 409);
    expectMapStatus(filter, "WORKSHOP_RESOURCE_UNAUTHORIZED", 401);
    expectMapStatus(filter, "WORKSHOP_RESOURCE_FORBIDDEN", 403);
    expectMapStatus(filter, "INVALID_WORKSHOP_REQUEST", 400);
  });
});

describe("HttpExceptionFilter", () => {
  it("maps Nest HTTP exceptions to structured responses", () => {
    const response = createResponse();
    const host = createHost(response);
    const filter = new HttpExceptionFilter();

    filter.catch(new BadRequestException(["invalid field"]), host);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: ["invalid field"],
        path: "/workshop",
        correlationId: "correlation-1",
      }),
    );
  });

  it("uses exception defaults when the response is not an object", () => {
    const response = createResponse();
    const host = createHost(response);
    const filter = new HttpExceptionFilter();

    filter.catch(new HttpException("plain error", 418), host);

    expect(response.status).toHaveBeenCalledWith(418);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 418,
        message: "plain error",
        error: "I_AM_A_TEAPOT",
      }),
    );
  });
});

function expectMapStatus(
  filter: DomainExceptionFilter,
  code: string,
  status: number,
): void {
  const response = createResponse();
  filter.catch(new DomainException(code, code), createHost(response));
  expect(response.status).toHaveBeenCalledWith(status);
}

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

function createHost(response: ReturnType<typeof createResponse>) {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({
        url: "/workshop",
        correlationId: "correlation-1",
      }),
    }),
  } as never;
}
