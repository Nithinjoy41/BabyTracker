using BabyTracker.Application.DTOs;
using BabyTracker.Application.Interfaces;
using BabyTracker.Domain.Entities;

namespace BabyTracker.Application.Services;

public class PhotoService
{
    private readonly IPhotoRepository _photos;
    private readonly IFileStorageService _storage;
    private readonly IUserRepository _users;
    private readonly IChildRepository _children;
    private readonly IFamilyRepository _families;

    public PhotoService(IPhotoRepository photos, IFileStorageService storage, IUserRepository users, IChildRepository children, IFamilyRepository families)
    {
        _photos = photos;
        _storage = storage;
        _users = users;
        _children = children;
        _families = families;
    }

    public async Task<PhotoResponseDto> UploadAsync(Guid userId, Guid childId, Stream fileStream, string fileName, string contentType, string? notes)
    {
        var child = await _children.GetByIdAsync(childId) 
            ?? throw new KeyNotFoundException("Child not found.");
            
        // Security check: Is user in this child's family?
        var membership = await _families.GetMemberAsync(userId, child.FamilyId);
        if (membership == null) throw new UnauthorizedAccessException();

        var url = await _storage.SaveFileAsync(fileStream, fileName, contentType);
        var photo = new Photo
        {
            Id = Guid.NewGuid(),
            FamilyId = child.FamilyId,
            ChildId = childId,
            UserId = userId,
            Url = url,
            Notes = notes,
            UploadedAt = DateTime.UtcNow
        };
        await _photos.CreateAsync(photo);
        var user = await _users.GetByIdAsync(userId);
        return new PhotoResponseDto(photo.Id, photo.Url, photo.Notes, user!.FullName, photo.UploadedAt);
    }

    public async Task<PagedResult<PhotoResponseDto>> GetByChildAsync(Guid childId, int page, int pageSize)
    {
        var (items, total) = await _photos.GetByChildAsync(childId, page, pageSize);
        var dtos = items.Select(p => new PhotoResponseDto(p.Id, p.Url, p.Notes, p.User.FullName, p.UploadedAt));
        return new PagedResult<PhotoResponseDto>(dtos, total, page, pageSize);
    }

    public async Task DeleteAsync(Guid id, Guid userId)
    {
        var photo = await _photos.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Photo not found.");
            
        // Security check: Is user in this family?
        var membership = await _families.GetMemberAsync(userId, photo.FamilyId);
        if (membership == null) throw new UnauthorizedAccessException();

        await _storage.DeleteFileAsync(photo.Url);
        await _photos.DeleteAsync(id);
    }
}
