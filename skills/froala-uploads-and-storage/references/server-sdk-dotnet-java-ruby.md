# .NET, Java and Ruby SDKs

Part of the froala-uploads-and-storage skill. Verified against the 5.6.0 sources: NuGet FroalaEditorSDK 5.6.0 (`.nupkg` and GitHub tag `v5.6.0`), GitHub `froala/wysiwyg-editor-java-sdk` tag `v5.6.0` (not on Maven Central), and RubyGems `froala-editor-sdk` 5.6.0. .NET and Java were **not run** (no runtime on the verification machine). Ruby's validation class was run under Ruby 2.6; the Rails upload path was not.

All three are reference implementations: authenticate the routes, check the file's bytes, limit the size and validate `src` yourself (see SKILL.md, Security checklist).

<!-- validate:skip -->
<!-- Server-language SDK names (PHP, Python, .NET, Java, Ruby) are not froala-editor APIs; they were verified against the 5.6.0 SDK sources instead. -->

## .NET: FroalaEditorSDK

Install: `dotnet add package FroalaEditorSDK` (the docs show `Install-Package FroalaEditorSDK`). Targets `net471` and `netstandard2.0`; namespace `FroalaEditor`.

Adapted from the SDK's ASP.NET Core demo (`demo-core/Controllers/FroalaApiController.cs`). The demo's `catch` returns `Json(e)` with status 200, which the editor reports as code 2; return a 4xx instead:

```csharp
public IActionResult UploadImage()
{
    string uploadPath = "wwwroot/uploads/";
    try
    {
        return Json(FroalaEditor.Image.Upload(HttpContext, uploadPath));
    }
    catch (Exception e)
    {
        return BadRequest(new { error = e.Message });
    }
}
```

| Call (5.6.0) | What it does |
|---|---|
| `Image.Upload(HttpContext, string fileRoute, FileOptions options = null)` | Saves `fileRoute + <unique>.<client extension>` and returns `{ link }` with `wwwroot/` removed. On .NET Core `fileRoute` is relative to the working directory, so pass `"wwwroot/uploads/"`. Creates the folder if needed |
| `File.Upload(...)`, `Video.Upload(...)` | Same with file or video defaults |
| `Image.Delete(string src)`, `File.Delete`, `Video.Delete` | .NET Core: deletes `"wwwroot/" + src`. .NET Framework: `Server.MapPath(src)` |
| `Image.List(string folderPath, string thumbPath = null)` | Image manager list |
| `S3.GetHash(S3Config config)` | `S3Config` properties: `Bucket`, `Region`, `KeyStart`, `Acl`, `AccessKey`, `SecretKey`, `Expiration` (minutes as a string, default 5) |

Options: `ImageOptions { Fieldname, Validation, ResizeGeometry }` (a Magick.NET `MagickGeometry`), `FileOptions`, `VideoOptions`; validation with `new ImageValidation(string[] exts, string[] mimeTypes)` or `new ImageValidation(Func<string, string, bool>)` (file path, MIME type).

Know:

- Validation uses the client's `ContentType` and file-name extension; the default image extensions include `svg`.
- `S3.GetHash` builds the expiry from `DateTime.Now` (server local time) but writes it with a `Z` (UTC) suffix. On a server west of UTC the policy is already expired; run in UTC.
- Dependencies pinned by the 5.6.0 package: `net471` uses `Magick.NET-Q16-AnyCPU` 7.10.2 (dozens of ImageMagick advisories); `netstandard2.0` uses `Newtonsoft.Json` 12.0.1 (GHSA-5crp-9r3c-p9vr, high) and `Microsoft.AspNetCore.*` 2.2.0 packages. Override them with newer versions in your project and test.

## Java: wysiwyg-editor-java-sdk

Install: download `Lib/wysiwyg-editor-java-sdk.jar` from the `v5.6.0` tag (plus the jars in `Lib/lib`: commons-io 2.5, gson 2.7, thumbnailator 0.4.8, commons-lang 2.6, commons-codec 1.1). It is not published to Maven Central. Package `com.froala.editor`.

| Call (5.6.0) | What it does |
|---|---|
| `Image.upload(HttpServletRequest req, String fileRoute[, ImageOptions options])` | Reads the multipart part `file`, writes `getRealPath(fileRoute + <unique>.<client extension>)`, validates, returns `Map` with `link`; throws `Exception` |
| `File.upload(...)`, `Video.upload(...)` | Same with file or video defaults |
| `Image.delete(HttpServletRequest req, String src)` | Deletes `getRealPath(src)` |
| `Image.list(req, folderPath[, thumbPath])` | Image manager list |
| `S3.getHash(S3Config config)` | `S3Config` public fields `bucket`, `region`, `keyStart`, `acl`, `accessKey`, `secretKey`; policy expires after 5 minutes |

Know:

- **It imports `javax.servlet`.** Jakarta EE 9+ containers and frameworks (Tomcat 10+, Spring Boot 3+) use `jakarta.servlet`, so the jar cannot be used there without rebuilding the source.
- The servlet needs multipart enabled (`@MultipartConfig`) so `req.getPart("file")` works.
- Validation uses the part's client `Content-Type` and the client extension. `S3.getHash` compares the region with `==` / `!=` on strings, so a region read at runtime (not a literal) gets `s3-us-east-1` instead of `s3`; set `uploadURL` on the client to avoid depending on it.
- The bundled commons-io 2.5 has advisories (GHSA-gwrp-pvrq-jmwv, GHSA-78wr-2p64-hpwj); use a current commons-io.

## Ruby on Rails: froala-editor-sdk

Install: `gem 'froala-editor-sdk'` in the Gemfile, then `bundle install`. It depends on `wysiwyg-rails` ~> 5.6.0, `mime-types` and `mini_magick`, and uses `Rails.root`.

```ruby
class UploadController < ActionController::Base
  def upload_image
    render json: FroalaEditorSDK::Image.upload(params, 'public/uploads/images', file_access_path: '/uploads/images/')
  end
end
```

| Call (5.6.0) | What it does |
|---|---|
| `Image.upload(params, upload_path = 'public/uploads/images', options = {})` | Saves `Rails.root/upload_path/<random>.<client extension>`, returns a JSON **string** `{"link": file_access_path + name}`; returns `nil` if the field is missing; raises on failed validation |
| `File.upload` (default path `public/uploads/files`), `Video.upload` (`public/uploads/videos`) | Same |
| `File.delete(file, path)` | Deletes `Rails.root/path/File.basename(file)`; returns true/false. Only the base name is used, so `src` cannot leave `path` |
| `Image.load_images(path, options = {})` | JSON string `[{url}]` for the image manager |
| `S3.data_hash(options)` | Hash for `imageUploadToS3` from `bucket`, `region`, `keyStart`, `acl`, `accessKey`, `secretKey`; policy expires after **10 hours** |

Know:

- **Pass `file_access_path` that matches `upload_path`.** The default `file_access_path` is `'/uploads/'`, but images are saved under `public/uploads/images`, so the default link (`/uploads/<name>`) points to a file that is not there (from the source).
- **The MIME check never runs.** `Validation.check` evaluates `ext(...) && mime(...)`; `ext` returns `nil` when the extension is allowed, so `mime` is skipped. Run: an upload named `evil.png` with type `text/html` passed. Only the client's extension is checked.
- Default file types include `.html` and `.json`, and images include `.svg`; uploaded HTML or SVG served from your domain can run script. Override `validation` with your own lambda `(path, mime)` that inspects the file.

<!-- validate:end -->

Docs: https://froala.com/wysiwyg-editor/docs/sdks/dotnet/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-uploads-and-storage, https://froala.com/wysiwyg-editor/docs/sdks/java/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-uploads-and-storage, https://froala.com/wysiwyg-editor/docs/sdks/ruby/?utm_source=froala-skills&utm_medium=agent-skill&utm_content=froala-uploads-and-storage
