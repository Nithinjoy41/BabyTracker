namespace BabyTracker.Application.DTOs;

// ── Auth ──────────────────────────────────────────────
public record RegisterDto(string Email, string Password, string FullName);
public record LoginDto(string Email, string Password);
public record AuthResponseDto(string Token, string Email, string FullName, Guid? FamilyId, IEnumerable<ChildDto>? Children);
public record JoinFamilyDto(string InviteCode);

// ── Child ─────────────────────────────────────────────
public record CreateChildDto(string Name, DateTime DateOfBirth);
public record ChildDto(Guid Id, string Name, DateTime DateOfBirth);

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

// ── Family & Invites ──────────────────────────────────
public record FamilyResponseDto(Guid Id, string Name, string InviteCode, IEnumerable<string> Members, IEnumerable<ChildDto> Children);
public record GenerateInviteDto(string? Email);
public record InviteResponseDto(string Code, DateTime ExpiresAt);

// ── Birthday Planner ──────────────────────────────────
public record BirthdayPlanDto(Guid Id, Guid ChildId, string Theme, string Location, string Notes, DateTime? Date, IEnumerable<BirthdayGuestDto> Guests);
public record BirthdayGuestDto(Guid Id, string Name, string Status, int AdditionalAdults, int AdditionalChildren, string? SubGuests);
public record UpdateBirthdayPlanDto(string Theme, string Location, string Notes, DateTime? Date);
public record UpdateGuestDto(string Status, int AdditionalAdults, int AdditionalChildren, string? SubGuests);
public record AddBirthdayGuestDto(string Name);

// ── Pagination ────────────────────────────────────────
public record PagedResult<T>(IEnumerable<T> Items, int TotalCount, int Page, int PageSize);
