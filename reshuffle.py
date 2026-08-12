import re

def reorder_view_grid():
    with open('view_grid.txt', 'r', encoding='utf-8') as f:
        content = f.read()

    blocks = re.split(r'(\s*\{/\*.*?\*/\}\s*<div className="flex items-center|<div className="flex items-center)', content)
    
    start = blocks[0]
    
    divs = []
    for i in range(1, len(blocks), 2):
        divs.append(blocks[i] + blocks[i+1])

    # Put Designation, Mobile Number, Gender first. Then the rest in original order.
    # The original order in view_grid.txt:
    original_order = [
        "Designation", "Section", "Department Group", "Mobile Number", "Date of Joining",
        "Date of Birth", "Grade / Level", "Employee Region", "Employment Status", "Gender",
        "Location", "Organization", "Highest Qualification", "Department", "Aadhar Number",
        "Emp Group M/NM/W", "On Roll / Contract", "Reporting Manager"
    ]
    
    new_order = [
        "Designation", "Mobile Number", "Gender",
        "Section", "Department Group", "Date of Joining",
        "Date of Birth", "Grade / Level", "Employee Region", "Employment Status",
        "Location", "Organization", "Highest Qualification", "Department", "Aadhar Number",
        "Emp Group M/NM/W", "On Roll / Contract", "Reporting Manager"
    ]

    order_map = {k: v for v, k in enumerate(new_order)}

    def get_sort_key(div_text):
        if 'Mobile Number' in div_text and 'employee.mobile' in div_text: return order_map["Mobile Number"]
        if 'Date of Birth' in div_text: return order_map["Date of Birth"]
        if 'Gender' in div_text: return order_map["Gender"]
        if 'Aadhar Number' in div_text: return order_map["Aadhar Number"]
        if 'Highest Qualification' in div_text: return order_map["Highest Qualification"]
        if '{/* Designation */}' in div_text: return order_map["Designation"]
        if '{/* Department */}' in div_text: return order_map["Department"]
        if 'Department Group' in div_text: return order_map["Department Group"]
        if 'Section' in div_text: return order_map["Section"]
        if 'Grade / Level' in div_text: return order_map["Grade / Level"]
        if 'Emp Group M/NM/W' in div_text: return order_map["Emp Group M/NM/W"]
        if 'Reporting Manager' in div_text: return order_map["Reporting Manager"]
        if '{/* Organization */}' in div_text: return order_map["Organization"]
        if 'Employee Region' in div_text: return order_map["Employee Region"]
        if '{/* Region */}' in div_text: return order_map["Location"]
        if 'Date of Joining' in div_text: return order_map["Date of Joining"]
        if 'On Roll / Contract' in div_text: return order_map["On Roll / Contract"]
        if 'Employment Status' in div_text: return order_map["Employment Status"]
        return 99

    divs.sort(key=get_sort_key)
    
    return start + "".join(divs)

def reorder_edit_grid():
    with open('edit_grid.txt', 'r', encoding='utf-8') as f:
        content = f.read()

    blocks = re.split(r'(\s*<div className="space-y-1">)', content)
    start = blocks[0]
    
    divs = []
    for i in range(1, len(blocks), 2):
        divs.append(blocks[i] + blocks[i+1])

    new_order = [
        "Employee ID *", "Full Name *", "Email Address *",
        "Designation *", "Mobile Number", "Gender *",
        "Date of Joining", "Date of Birth", "Grade  *", "Section *", "Department Group *",
        "Employment Status", "Region *", "Location *", "Organization *", "Highest Qualification",
        "Department *", "Aadhar Number", "Emp Group M/NM/W *", "On Roll / Contract *",
        "Manager ID *", "Manager Name *", "Manager Email *", "Manager Mobile *"
    ]
    order_map = {k: v for v, k in enumerate(new_order)}

    def get_sort_key(div_text):
        for k, v in order_map.items():
            if f">{k}<" in div_text:
                return v
        return 99
        
    divs.sort(key=get_sort_key)
    return start + "".join(divs)

with open('components/TNIProfile.tsx', 'r', encoding='utf-8') as f:
    full_content = f.read()

new_view = reorder_view_grid()
new_edit = reorder_edit_grid()

edit_pattern = re.compile(r'<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-h-\[75vh\] md:max-h-\[60vh\] overflow-y-auto pr-1 pb-4" style={{ scrollbarWidth: \'thin\' }}>.*?</div>\s*</div>\s*<div className="mt-5 pt-3', re.DOTALL)

with open('edit_grid.txt', 'r', encoding='utf-8') as f:
    orig_edit = f.read()

full_content = full_content.replace(orig_edit, new_edit)

with open('view_grid.txt', 'r', encoding='utf-8') as f:
    orig_view = f.read()

full_content = full_content.replace(orig_view, new_view)

with open('components/TNIProfile.tsx', 'w', encoding='utf-8') as f:
    f.write(full_content)
