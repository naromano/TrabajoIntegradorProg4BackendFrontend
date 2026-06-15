from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import get_current_user, require_roles
from app.modules.uploads.service import upload_image, delete_image

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

router = APIRouter()


@router.post("/", summary="Subir imagen a Cloudinary")
async def upload_file(
    file: UploadFile = File(...),
    folder: str = "productos",
    _current_user=Depends(get_current_user),
    _allowed=Depends(require_roles("ADMIN", "STOCK")),
    _session: Session = Depends(get_session),
):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Formato no permitido: {file.content_type}. Usa JPEG, PNG o WebP.",
        )

    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El archivo excede el tamano maximo de 5 MB.",
        )

    result = upload_image(contents, folder=folder)
    return {
        "url": result["url"],
        "public_id": result["public_id"],
    }


@router.delete(
    "/{public_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar imagen de Cloudinary",
)
async def delete_imagen(
    public_id: str,
    _current_user=Depends(get_current_user),
    _allowed=Depends(require_roles("ADMIN")),
    _session: Session = Depends(get_session),
):
    delete_image(public_id)
