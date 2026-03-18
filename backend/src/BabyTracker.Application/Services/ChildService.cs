using BabyTracker.Application.DTOs;
using BabyTracker.Application.Interfaces;
using BabyTracker.Domain.Entities;

namespace BabyTracker.Application.Services;

public class ChildService
{
    private readonly IChildRepository _children;
    private readonly IFamilyRepository _families;

    public ChildService(IChildRepository children, IFamilyRepository families)
    {
        _children = children;
        _families = families;
    }

    public async Task<ChildDto> AddChildAsync(Guid familyId, CreateChildDto dto)
    {
        var child = new Child
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId,
            Name = dto.Name,
            DateOfBirth = DateTime.SpecifyKind(dto.DateOfBirth, DateTimeKind.Utc),
            CreatedAt = DateTime.UtcNow
        };
        await _children.CreateAsync(child);
        return new ChildDto(child.Id, child.Name, child.DateOfBirth);
    }

    public async Task<IEnumerable<ChildDto>> GetChildrenAsync(Guid userId)
    {
        var families = await _families.GetFamiliesForUserAsync(userId);
        return families
            .SelectMany(f => f.Children ?? Enumerable.Empty<Child>())
            .Select(c => new ChildDto(c.Id, c.Name, c.DateOfBirth))
            .DistinctBy(c => c.Id);
    }

    public async Task DeleteChildAsync(Guid childId, Guid userId)
    {
        var child = await _children.GetByIdAsync(childId)
            ?? throw new KeyNotFoundException("Child not found.");

        var membership = await _families.GetMemberAsync(userId, child.FamilyId);
        if (membership == null) throw new UnauthorizedAccessException();

        await _children.DeleteAsync(childId);
    }
}
