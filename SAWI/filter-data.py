import json


def process_json_file(input_file_path, encoding="utf-8"):
    with open(input_file_path, "r", encoding=encoding) as file:
        data = json.load(file)

    data = data.get("data")

    # Only consider rows with "Auctions" in subject
    filtered_data = []
    for item in data:
        if "Subject" in item:
            subjects = [s.strip() for s in item["Subject"].split(",")]
            print(subjects)
            if "Auctions" in subjects:
                filtered_data.append(item)

    # Remove "Auctions" from Subject field
    for item in filtered_data:
        if "Subject" in item:
            subjects = [s.strip() for s in item["Subject"].split(",")]
            subjects = [s for s in subjects if s != "Auctions"]
            item["Subject"] = ", ".join(subjects)

    # Find all unique Type and Subject (auctions) values
    type_values = set()
    subject_values = set()
    for item in filtered_data:
        if "Type" in item:
            type_values.add(item["Type"])
        if "Subject" in item:
            subject = [s.strip() for s in item["Subject"].split(",")]
            for s in subject:
                if s != "":
                    subject_values.add(s)

    return (
        filtered_data,
        sorted(list(type_values)),
        sorted(list(subject_values), reverse=True),
    )


input_file = "websitemasterlist.json"
filtered_data, unique_types, subjects = process_json_file(input_file)

with open("filtered_output.json", "w") as outfile:
    json.dump(filtered_data, outfile, indent=4)

with open("auctions.json", "w", encoding="utf-8") as outfile:
    json.dump(subjects, outfile, indent=4, ensure_ascii=False)

with open("types.json", "w", encoding="utf-8") as outfile:
    json.dump(unique_types, outfile, indent=4, ensure_ascii=False)

print("\nFiltered data saved to 'filtered_output.json'")
