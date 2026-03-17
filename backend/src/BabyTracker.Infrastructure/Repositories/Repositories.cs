using BabyTracker.Application.Interfaces;
using BabyTracker.Domain.Entities;
using BabyTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BabyTracker.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly BabyTrackerDbContext _db;
    public UserRepository(BabyTrackerDbContext db) => _db = db;

    public async Task<User?> GetByIdAsync(Guid id) => await _db.Users.FindAsync(id);
    public async Task<User?> GetByEmailAsync(string email) =>
        await _db.Users.FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant());

    public async Task<User> CreateAsync(User user)
    {
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return user;
    }
}

public class FamilyRepository : IFamilyRepository
{
    private readonly BabyTrackerDbContext _db;
    public FamilyRepository(BabyTrackerDbContext db) => _db = db;

    public async Task<Family?> GetByIdAsync(Guid id) =>
        await _db.Families.Include(f => f.Members).ThenInclude(m => m.User)
            .Include(f => f.Children)
            .FirstOrDefaultAsync(f => f.Id == id);

    public async Task<Family?> GetByInviteCodeAsync(string inviteCode) =>
        await _db.Families.Include(f => f.Members).ThenInclude(m => m.User)
            .Include(f => f.Children)
            .FirstOrDefaultAsync(f => f.InviteCode == inviteCode);

    public async Task<Family> CreateAsync(Family family)
    {
        _db.Families.Add(family);
        await _db.SaveChangesAsync();
        return family;
    }

    public async Task<FamilyMember> AddMemberAsync(FamilyMember member)
    {
        _db.FamilyMembers.Add(member);
        await _db.SaveChangesAsync();
        return member;
    }

    public async Task<Guid?> GetFamilyIdForUserAsync(Guid userId)
    {
        var membership = await _db.FamilyMembers.FirstOrDefaultAsync(m => m.UserId == userId);
        return membership?.FamilyId;
    }

    public async Task<FamilyMember> UpdateMemberAsync(FamilyMember member)
    {
        _db.FamilyMembers.Update(member);
        await _db.SaveChangesAsync();
        return member;
    }

    public async Task<FamilyMember?> GetMemberAsync(Guid userId, Guid familyId) =>
        await _db.FamilyMembers.FirstOrDefaultAsync(fm => fm.UserId == userId && fm.FamilyId == familyId);
}

public class ChildRepository : IChildRepository
{
    private readonly BabyTrackerDbContext _db;
    public ChildRepository(BabyTrackerDbContext db) => _db = db;

    public async Task<Child?> GetByIdAsync(Guid id) => await _db.Children.FindAsync(id);

    public async Task<IEnumerable<Child>> GetByFamilyAsync(Guid familyId) =>
        await _db.Children.Where(c => c.FamilyId == familyId)
            .OrderBy(c => c.DateOfBirth)
            .ToListAsync();

    public async Task<Child> CreateAsync(Child child)
    {
        _db.Children.Add(child);
        await _db.SaveChangesAsync();
        return child;
    }

    public async Task DeleteAsync(Guid id)
    {
        var child = await _db.Children.FindAsync(id);
        if (child is not null) { _db.Children.Remove(child); await _db.SaveChangesAsync(); }
    }
}

public class LogRepository : ILogRepository
{
    private readonly BabyTrackerDbContext _db;
    public LogRepository(BabyTrackerDbContext db) => _db = db;

    public async Task<LogEntry?> GetByIdAsync(Guid id) => await _db.LogEntries.FindAsync(id);

    public async Task<(IEnumerable<LogEntry> Items, int TotalCount)> GetByChildAsync(Guid childId, int page, int pageSize)
    {
        var query = _db.LogEntries.Where(l => l.ChildId == childId).Include(l => l.User)
            .OrderByDescending(l => l.Timestamp);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return (items, total);
    }

    public async Task<LogEntry> CreateAsync(LogEntry entry)
    {
        _db.LogEntries.Add(entry);
        await _db.SaveChangesAsync();
        return entry;
    }

    public async Task DeleteAsync(Guid id)
    {
        var entry = await _db.LogEntries.FindAsync(id);
        if (entry is not null) { _db.LogEntries.Remove(entry); await _db.SaveChangesAsync(); }
    }
}

public class VaccineRepository : IVaccineRepository
{
    private readonly BabyTrackerDbContext _db;
    public VaccineRepository(BabyTrackerDbContext db) => _db = db;

    public async Task<Vaccine?> GetByIdAsync(Guid id) => await _db.Vaccines.FindAsync(id);

    public async Task<(IEnumerable<Vaccine> Items, int TotalCount)> GetByChildAsync(Guid childId, int page, int pageSize)
    {
        var query = _db.Vaccines.Where(v => v.ChildId == childId).Include(v => v.User)
            .OrderByDescending(v => v.Date);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return (items, total);
    }

    public async Task<Vaccine> CreateAsync(Vaccine vaccine)
    {
        _db.Vaccines.Add(vaccine);
        await _db.SaveChangesAsync();
        return vaccine;
    }

    public async Task DeleteAsync(Guid id)
    {
        var entry = await _db.Vaccines.FindAsync(id);
        if (entry is not null) { _db.Vaccines.Remove(entry); await _db.SaveChangesAsync(); }
    }
}

public class PhotoRepository : IPhotoRepository
{
    private readonly BabyTrackerDbContext _db;
    public PhotoRepository(BabyTrackerDbContext db) => _db = db;

    public async Task<Photo?> GetByIdAsync(Guid id) => await _db.Photos.FindAsync(id);

    public async Task<(IEnumerable<Photo> Items, int TotalCount)> GetByChildAsync(Guid childId, int page, int pageSize)
    {
        var query = _db.Photos.Where(p => p.ChildId == childId).Include(p => p.User)
            .OrderByDescending(p => p.UploadedAt);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return (items, total);
    }

    public async Task<Photo> CreateAsync(Photo photo)
    {
        _db.Photos.Add(photo);
        await _db.SaveChangesAsync();
        return photo;
    }

    public async Task DeleteAsync(Guid id)
    {
        var entry = await _db.Photos.FindAsync(id);
        if (entry is not null) { _db.Photos.Remove(entry); await _db.SaveChangesAsync(); }
    }
}

public class InviteRepository : IInviteRepository
{
    private readonly BabyTrackerDbContext _db;
    public InviteRepository(BabyTrackerDbContext db) => _db = db;

    public async Task<FamilyInvite?> GetByIdAsync(Guid id) => await _db.FamilyInvites.FindAsync(id);

    public async Task<FamilyInvite?> GetByCodeAsync(string code) =>
        await _db.FamilyInvites.Include(i => i.Family).FirstOrDefaultAsync(i => i.Code == code);

    public async Task<FamilyInvite> CreateAsync(FamilyInvite invite)
    {
        _db.FamilyInvites.Add(invite);
        await _db.SaveChangesAsync();
        return invite;
    }

    public async Task<FamilyInvite> UpdateAsync(FamilyInvite invite)
    {
        _db.FamilyInvites.Update(invite);
        await _db.SaveChangesAsync();
        return invite;
    }

    public async Task DeleteAsync(Guid id)
    {
        var invite = await _db.FamilyInvites.FindAsync(id);
        if (invite is not null) { _db.FamilyInvites.Remove(invite); await _db.SaveChangesAsync(); }
    }
}
