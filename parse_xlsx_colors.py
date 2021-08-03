import openpyxl
from openpyxl import load_workbook
import json
from json import dumps

# print(cell.__dir__())
# print(cell.fill.bgColor.__dir__())
# print(cell.fill.bgColor.value)
# print(cell.fill.bgColor.rgb)
# print(cell.fill.fgColor.value)
# print(cell.fill.fgColor.rgb)

# print ('HEX =',color_in_hex)
# print('RGB =', tuple(int(color_in_hex[i:i+2], 16) for i in (0, 2, 4))) # Color in RGB


def parse_colors(excel_file, sheet_name):
    wb = load_workbook(excel_file, data_only=True)
    sh = wb[sheet_name]
    ret = {}

    for index, row in enumerate(sh.rows):
        if index == 0:
            continue

        description = row[1].value
        colors = {}
        colorCells = row[4:8]

        for cell in colorCells:
            # Ignoring first 2 digits in Anroid color format (alpha layer).
            hexVal = str(cell.fill.fgColor.value)[2:]
            if hexVal in colors.keys():
                colors[hexVal] += 25
            else:
                colors[hexVal] = 25

        # Sort in accordance with the DB Schema's format
        # (sorted by weight in reverse order).
        zipped = zip(colors.values(), colors.keys())
        r = reversed(sorted(zipped))
        colorList = []
        weightList = []
        for w, c in r:
            colorList.append(c)
            weightList.append(w)

        item_colors = {
            "colors": colorList,
            "weights": weightList
        }

        iterator_name = 1
        if description in ret.keys():
            iterated = description + f" ({iterator_name})"
            while iterated in ret.keys():
                iterator_name += 1
                iterated = description + f" ({iterator_name})"
            description = iterated

        ret[description] = item_colors

    return ret


def export_json(obj):
    json_string = json.dumps(obj)

    file = open("public_html/csv-port/json_colors.ts", "w")
    file.write('export const spreadsheetColors = ')
    file.write(json_string)
    file.close()
    
def main():
    excel_file = 'public_html/csv-port/items-copy.xlsx'
    sheet_name = "Wardrobe"
    to_json = parse_colors(excel_file, sheet_name)
    export_json(to_json)


if __name__ == "__main__":
    main()
