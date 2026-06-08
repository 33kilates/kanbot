from PIL import Image

def autocrop_image(image_path, output_path):
    img = Image.open(image_path)
    # Get the bounding box of the non-zero regions in the image
    bbox = img.getbbox()
    if bbox:
        # Crop the image to the contents of the bounding box
        img_cropped = img.crop(bbox)
        img_cropped.save(output_path)
        print(f"Image cropped and saved to {output_path}")
    else:
        print("Image is entirely empty/transparent.")

autocrop_image('assets/logo.png', 'assets/logo_cropped.png')
