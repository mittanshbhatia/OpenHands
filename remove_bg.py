from PIL import Image

def remove_background(input_path, output_path, tolerance=50):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        # item is (R, G, B, A)
        r, g, b, a = item
        
        # Apple Maps pin is black and white. 
        # So we keep pixels that are very dark (black) or very bright and neutral (white)
        # Background is beige or green.
        
        is_black = (r < 80 and g < 80 and b < 80)
        is_white = (r > 200 and g > 200 and b > 200 and abs(r-g) < 20 and abs(g-b) < 20)
        
        if is_black or is_white:
            new_data.append(item)
        else:
            # Check for anti-aliasing pixels (greyish) near black/white
            if abs(r-g) < 20 and abs(g-b) < 20 and r < 180:
                # Darkish grey, keep it but maybe add some transparency based on lightness
                new_data.append((0, 0, 0, int(255 * (1 - r/180.0))))
            else:
                new_data.append((255, 255, 255, 0)) # transparent

    img.putdata(new_data)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    import sys
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    remove_background(input_file, output_file)
