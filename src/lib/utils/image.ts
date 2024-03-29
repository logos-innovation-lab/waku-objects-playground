interface Dimensions {
	width: number
	height: number
}

interface DimensionsWithOffset extends Dimensions {
	dw: number
	dh: number
}

/**
 * Get the dimensions of the image after clip
 *
 * @param imgWidth  Current image width
 * @param imgHeight Current image height
 * @param maxWidth  Desired max width
 * @param maxHeight Desired max height
 *
 * @returns Downscaled dimensions of the image to fit in the bounding box
 */
function getClipDimensions(
	imgWidth: number,
	imgHeight: number,
	width: number,
	height: number,
): DimensionsWithOffset {
	const ratioWidth = imgWidth / width
	const ratioHeight = imgHeight / height

	// No need to resize/clip
	if (Math.max(ratioWidth, ratioHeight) <= 1)
		return { width: imgWidth, height: imgHeight, dw: 0, dh: 0 }

	const ratio = Math.min(ratioWidth, ratioHeight)

	// We need to scale and resize
	if (ratio > 1)
		return {
			width: imgWidth / ratio,
			height: imgHeight / ratio,
			dw: (width - imgWidth / ratio) / 2,
			dh: (height - imgHeight / ratio) / 2,
		}

	if (ratioWidth < 1) {
		return { width: imgWidth, height: imgHeight, dw: 0, dh: (height - imgHeight) / 2 }
	}

	return { width: imgWidth, height: imgHeight, dw: (width - imgWidth) / 2, dh: 0 }
}

const allowedTypes = [
	'image/bmp',
	'image/gif',
	'image/vnd.microsoft.icon',
	'image/jpeg',
	'image/png',
	'image/svg+xml',
	'image/tiff',
	'image/webp',
	'image/heic',
	'image/heif',
]

function assertIsSupported(file: File) {
	if (!file.size || !file.type || !allowedTypes.includes(file.type))
		throw new Error(`File not supported! File type: ${file.type}`)
}

async function getFile(file: File): Promise<File> {
	if (file.type === 'image/heic' || file.type === 'image/heif') {
		return new File([await convertHeicToPng(file)], file.name, { type: 'image/png' })
	}
	return file
}

/**
 * Convert a HEIC file to PNG format.
 *
 * @param heicFile The HEIC file to be converted.
 * @returns A promise that resolves to a Blob in PNG format.
 */
async function convertHeicToPng(heicFile: File): Promise<Blob> {
	const heic2any = await import('heic2any')
	const out = await heic2any.default({
		blob: heicFile,
		toType: 'image/png',
	})
	if (Array.isArray(out) && out[0]) return out[0]
	if (out instanceof Blob) return out
	throw new Error('Failed to convert HEIC to PNG')
}

/**
 * Resize image passed to fit in the bounding box defined with maxWidth and maxHeight.
 * Note that one or both of the bounding box dimensions may be omitted
 *
 * @param file   Image file to be resized
 * @param width  Desired image width
 * @param height Desired image height
 *
 * @returns Promise that resolves into the clipped and resized image as base64 string
 */
export async function clipAndResize(file: File, width: number, height: number): Promise<string> {
	assertIsSupported(file)

	const f = await getFile(file)

	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.readAsDataURL(f)
		reader.onerror = (error) => reject(error)
		reader.onload = (event) => {
			const src = event?.target?.result

			if (!src || typeof src !== 'string') throw new Error('Failed to load the image source')

			const img = new Image()
			img.src = src
			img.onload = () => {
				const dimensions = getClipDimensions(img.width, img.height, width, height)
				const elem = document.createElement('canvas')
				elem.width = dimensions.dw >= 0 ? Math.min(width, dimensions.width) : width
				elem.height = dimensions.dh >= 0 ? Math.min(height, dimensions.height) : height
				const ctx = elem.getContext('2d')

				if (!ctx) throw new Error('Failed to create canvas context')

				ctx.drawImage(img, dimensions.dw, dimensions.dh, dimensions.width, dimensions.height)
				resolve(ctx.canvas.toDataURL())
			}
		}
	})
}

/**
 * Get the dimensions of the image after resize
 *
 * @param imgWidth  Current image width
 * @param imgHeight Current image height
 * @param maxWidth  Desired max width
 * @param maxHeight Desired max height
 *
 * @returns Downscaled dimensions of the image to fit in the bounding box
 */
export function getResizeDimensions(
	imgWidth: number,
	imgHeight: number,
	maxWidth?: number,
	maxHeight?: number,
): Dimensions {
	const ratioWidth = maxWidth ? imgWidth / maxWidth : 1
	const ratioHeight = maxHeight ? imgHeight / maxHeight : 1

	const ratio = Math.max(ratioWidth, ratioHeight)

	// No need to resize
	if (ratio <= 1) return { width: imgWidth, height: imgHeight }

	return { width: imgWidth / ratio, height: imgHeight / ratio }
}

/**
 * Resize image passed to fit in the bounding box defined with maxWidth and maxHeight.
 * Note that one or both of the bounding box dimensions may be omitted
 *
 * @param file      Image file to be resized
 * @param maxWidth  Maximal image width
 * @param maxHeight Maximal image height
 *
 * @returns Promise that resolves into the resized image as base64 string
 */
export async function resize(file: File, maxWidth?: number, maxHeight?: number): Promise<string> {
	assertIsSupported(file)

	const f = await getFile(file)
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.readAsDataURL(f)
		reader.onerror = (error) => reject(error)
		reader.onload = (event) => {
			const src = event?.target?.result

			if (!src || typeof src !== 'string') throw new Error('Failed to load the image source')

			const img = new Image()
			img.src = src
			img.onload = () => {
				const dimensions = getResizeDimensions(img.width, img.height, maxWidth, maxHeight)
				const elem = document.createElement('canvas')
				elem.width = dimensions.width
				elem.height = dimensions.height
				const ctx = elem.getContext('2d')

				if (!ctx) throw new Error('Failed to create canvas context')

				ctx.drawImage(img, 0, 0, elem.width, elem.height)
				resolve(ctx.canvas.toDataURL())
			}
		}
	})
}
