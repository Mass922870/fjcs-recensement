/** Erreurs métier typées - traduites en messages utilisateur par les actions. */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class DuplicatePhoneError extends AppError {
  constructor() {
    super("Ce numéro de téléphone est déjà associé à une inscription.", "DUPLICATE_PHONE", 409);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Vous n'avez pas les droits nécessaires pour cette action.") {
    super(message, "FORBIDDEN", 403);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentification requise.") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Ressource introuvable.") {
    super(message, "NOT_FOUND", 404);
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Données invalides.",
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message, "VALIDATION", 422);
  }
}
