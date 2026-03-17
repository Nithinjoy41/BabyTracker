using BabyTracker.Application.Interfaces;

namespace BabyTracker.Infrastructure.Storage;

public class LocalFileStorageService : IFileStorageService
{
    private readonly string _storagePath;

    public LocalFileStorageService(string storagePath = "uploads")
    {
        _storagePath = storagePath;
        Directory.CreateDirectory(_storagePath);
    }

    public async Task<string> SaveFileAsync(Stream stream, string fileName, string contentType)
    {
        var uniqueName = $"{Guid.NewGuid():N}_{fileName}";
        var filePath = Path.Combine(_storagePath, uniqueName);
        await using var fs = new FileStream(filePath, FileMode.Create);
        await stream.CopyToAsync(fs);
        // Return a relative URL; the API middleware serves static files from /uploads
        return $"/uploads/{uniqueName}";
    }

    public Task DeleteFileAsync(string url)
    {
        var fileName = Path.GetFileName(url);
        var filePath = Path.Combine(_storagePath, fileName);
        if (File.Exists(filePath)) File.Delete(filePath);
        return Task.CompletedTask;
    }
}
