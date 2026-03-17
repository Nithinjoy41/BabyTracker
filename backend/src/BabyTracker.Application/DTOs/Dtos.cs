namespace BabyTracker.Application.DTOs;

// ── Auth ──────────────────────────────────────────────
public record RegisterDto(string Email, string Password, string FullName);
public record LoginDto(string Email, string Password);
public record AuthResponseDto(string Token, string Email, string FullName, Guid? FamilyId);
public record JoinFamilyDto(string InviteCode);

// ── Log Entry ─────────────────────────────────────────
public record CreateLogEntryDto(string Type, DateTime Timestamp, int? DurationMinutes, string? Notes);
public record LogEntryResponseDto(
    Guid Id, string Type, DateTime Timestamp, int? DurationMinutes,
    string? Notes, string CreatedBy, DateTime CreatedAt);

// ── Vaccine ───────────────────────────────────────────
public record CreateVaccineDto(string Name, DateTime Date, string? Notes);
public record VaccineResponseDto(Guid Id, string Name, DateTime Date, string? Notes, string CreatedBy);

// ── Photo ─────────────────────────────────────────────
public record PhotoResponseDto(Guid Id, string Url, string? Notes, string UploadedBy, DateTime UploadedAt);

// ── Family ────────────────────────────────────────────
public record FamilyResponseDto(Guid Id, string Name, string InviteCode, IEnumerable<string> Members);

// ── Pagination ────────────────────────────────────────
public record PagedResult<T>(IEnumerable<T> Items, int TotalCount, int Page, int PageSize);
