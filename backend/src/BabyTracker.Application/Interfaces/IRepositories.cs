using BabyTracker.Domain.Entities;

namespace BabyTracker.Application.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> GetByEmailAsync(string email);
    Task<User> CreateAsync(User user);
}

public interface IFamilyRepository
{
    Task<Family?> GetByIdAsync(Guid id);
    Task<Family?> GetByInviteCodeAsync(string inviteCode);
    Task<Family> CreateAsync(Family family);
    Task<FamilyMember> AddMemberAsync(FamilyMember member);
    Task<Guid?> GetFamilyIdForUserAsync(Guid userId);
}

public interface IChildRepository
{
    Task<Child?> GetByIdAsync(Guid id);
    Task<IEnumerable<Child>> GetByFamilyAsync(Guid familyId);
    Task<Child> CreateAsync(Child child);
    Task DeleteAsync(Guid id);
}

public interface ILogRepository
{
    Task<LogEntry?> GetByIdAsync(Guid id);
    Task<(IEnumerable<LogEntry> Items, int TotalCount)> GetByChildAsync(Guid childId, int page, int pageSize);
    Task<LogEntry> CreateAsync(LogEntry entry);
    Task DeleteAsync(Guid id);
}

public interface IVaccineRepository
{
    Task<Vaccine?> GetByIdAsync(Guid id);
    Task<(IEnumerable<Vaccine> Items, int TotalCount)> GetByChildAsync(Guid childId, int page, int pageSize);
    Task<Vaccine> CreateAsync(Vaccine vaccine);
    Task DeleteAsync(Guid id);
}

public interface IPhotoRepository
{
    Task<Photo?> GetByIdAsync(Guid id);
    Task<(IEnumerable<Photo> Items, int TotalCount)> GetByChildAsync(Guid childId, int page, int pageSize);
    Task<Photo> CreateAsync(Photo photo);
    Task DeleteAsync(Guid id);
}
