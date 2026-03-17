using BabyTracker.Application.DTOs;
using BabyTracker.Application.Interfaces;
using BabyTracker.Domain.Entities;

namespace BabyTracker.Application.Services;

public class LogService
{
    private readonly ILogRepository _logs;
    private readonly IUserRepository _users;

    public LogService(ILogRepository logs, IUserRepository users)
    {
        _logs = logs;
        _users = users;
    }

    public async Task<LogEntryResponseDto> CreateAsync(Guid userId, Guid familyId, CreateLogEntryDto dto)
    {
        var entry = new LogEntry
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId,
            UserId = userId,
            Type = Enum.Parse<LogType>(dto.Type),
            Timestamp = dto.Timestamp,
            DurationMinutes = dto.DurationMinutes,
            Notes = dto.Notes
        };
        await _logs.CreateAsync(entry);
        var user = await _users.GetByIdAsync(userId);
        return ToDto(entry, user!.FullName);
    }

    public async Task<PagedResult<LogEntryResponseDto>> GetByFamilyAsync(Guid familyId, int page, int pageSize)
    {
        var (items, total) = await _logs.GetByFamilyAsync(familyId, page, pageSize);
        var dtos = items.Select(e => ToDto(e, e.User.FullName));
        return new PagedResult<LogEntryResponseDto>(dtos, total, page, pageSize);
    }

    public async Task DeleteAsync(Guid id, Guid familyId)
    {
        var entry = await _logs.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Log entry not found.");
        if (entry.FamilyId != familyId)
            throw new UnauthorizedAccessException();
        await _logs.DeleteAsync(id);
    }

    private static LogEntryResponseDto ToDto(LogEntry e, string createdBy)
        => new(e.Id, e.Type.ToString(), e.Timestamp, e.DurationMinutes, e.Notes, createdBy, e.Timestamp);
}
