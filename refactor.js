const fs = require('fs');
const file = 'c:/Users/BVG/Documents/GitHub/Nominations-management/components/admin/EmployeeManager.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove modal states from EmployeeManager
content = content.replace(/    const \[selectedGrade, setSelectedGrade\] = useState\('EXECUTIVE'\);\r?\n    const \[selectedGender, setSelectedGender\] = useState\(''\);\r?\n    const \[selectedEmployeeGrouupMNmw, setSelectedEmployeeGrouupMNmw\] = useState\(''\);\r?\n    const \[selectedOnRollContract, setSelectedOnRollContract\] = useState\(''\);\r?\n\r?\n    const \[selectedFormRegion, setSelectedFormRegion\] = useState\(''\);\r?\n    const \[selectedFormLocation, setSelectedFormLocation\] = useState\(''\);\r?\n    const \[selectedFormSection, setSelectedFormSection\] = useState\(''\);\r?\n    const \[selectedFormDeptGroup, setSelectedFormDeptGroup\] = useState\(''\);\r?\n/g, '');

// 2. Remove state resets in handleAdd
content = content.replace(/            setSelectedGrade\('EXECUTIVE'\);\r?\n            setSelectedGender\(''\);\r?\n            setSelectedEmployeeGrouupMNmw\(''\);\r?\n            setSelectedOnRollContract\(''\);\r?\n            setSelectedFormRegion\(''\);\r?\n            setSelectedFormLocation\(''\);\r?\n            setSelectedFormSection\(''\);\r?\n            setSelectedFormDeptGroup\(''\);\r?\n/g, '');

// 3. Extract EmployeeModal component
const modalStartRegex = /    const EmployeeModal = \(\{ employee, isEdit \}: \{ employee\?: Employee \| null, isEdit: boolean \}\) => \([\s\S]*?\n    \);\r?\n\r?\n/m;
const modalMatch = content.match(modalStartRegex);

if (modalMatch) {
    let modalCode = modalMatch[0];
    content = content.replace(modalStartRegex, '');
    
    // Transform modalCode to a standalone component
    let newModalCode = `
function EmployeeModal({ employee, isEdit, onClose, onSubmit, sectionOptions, locationOptions }: { employee?: Employee | null, isEdit: boolean, onClose: () => void, onSubmit: (formData: FormData) => void, sectionOptions: any[], locationOptions: any[] }) {
    const [selectedGrade, setSelectedGrade] = useState(employee?.grade || 'EXECUTIVE');
    const [selectedGender, setSelectedGender] = useState(employee?.gender || '');
    const [selectedEmployeeGrouupMNmw, setSelectedEmployeeGrouupMNmw] = useState(employee?.employeeGrouupMNmw || '');
    const [selectedOnRollContract, setSelectedOnRollContract] = useState(employee?.onRollContract || '');
    const [selectedFormRegion, setSelectedFormRegion] = useState(employee?.location || '');
    const [selectedFormSection, setSelectedFormSection] = useState(employee?.sectionName || '');
    const [selectedFormDeptGroup, setSelectedFormDeptGroup] = useState(employee?.departmentGroup || '');

    return (
` + modalCode.substring(modalCode.indexOf('<div className="fixed inset-0'), modalCode.lastIndexOf(');') ) + `
    );
}
`;

    // Update references in the newModalCode
    newModalCode = newModalCode.replace(/isEdit \? handleEdit : handleAdd/g, 'onSubmit');
    newModalCode = newModalCode.replace(/onClick=\{.*?isEdit \? setEditingEmployee\(null\) : setIsAddModalOpen\(false\).*?\}/g, 'onClick={onClose}');
    newModalCode = newModalCode.replace(/isEdit \? \(val\) => setEditingEmployee\(prev => prev \? \{ \.\.\.prev, grade: val \} : null\) : setSelectedGrade/g, 'setSelectedGrade');
    newModalCode = newModalCode.replace(/isEdit \? employee\?\.grade \|\| 'EXECUTIVE' : selectedGrade/g, 'selectedGrade');
    
    newModalCode = newModalCode.replace(/isEdit \? \(val\) => setEditingEmployee\(prev => prev \? \{ \.\.\.prev, sectionName: val \} : null\) : setSelectedFormSection/g, 'setSelectedFormSection');
    newModalCode = newModalCode.replace(/isEdit \? employee\?\.sectionName \|\| '' : selectedFormSection/g, 'selectedFormSection');
    
    newModalCode = newModalCode.replace(/isEdit \? \(val\) => setEditingEmployee\(prev => prev \? \{ \.\.\.prev, gender: val \} : null\) : setSelectedGender/g, 'setSelectedGender');
    newModalCode = newModalCode.replace(/isEdit \? employee\?\.gender \|\| '' : selectedGender/g, 'selectedGender');
    
    newModalCode = newModalCode.replace(/isEdit \? \(val\) => setEditingEmployee\(prev => prev \? \{ \.\.\.prev, location: val \} : null\) : setSelectedFormRegion/g, 'setSelectedFormRegion');
    newModalCode = newModalCode.replace(/isEdit \? employee\?\.location \|\| '' : selectedFormRegion/g, 'selectedFormRegion');
    
    newModalCode = newModalCode.replace(/isEdit \? \(val\) => setEditingEmployee\(prev => prev \? \{ \.\.\.prev, departmentGroup: val \} : null\) : setSelectedFormDeptGroup/g, 'setSelectedFormDeptGroup');
    newModalCode = newModalCode.replace(/isEdit \? employee\?\.departmentGroup \|\| '' : selectedFormDeptGroup/g, 'selectedFormDeptGroup');
    
    newModalCode = newModalCode.replace(/isEdit \? \(val\) => setEditingEmployee\(prev => prev \? \{ \.\.\.prev, employeeGrouupMNmw: val \} : null\) : setSelectedEmployeeGrouupMNmw/g, 'setSelectedEmployeeGrouupMNmw');
    newModalCode = newModalCode.replace(/isEdit \? employee\?\.employeeGrouupMNmw \|\| '' : selectedEmployeeGrouupMNmw/g, 'selectedEmployeeGrouupMNmw');
    
    newModalCode = newModalCode.replace(/isEdit \? \(val\) => setEditingEmployee\(prev => prev \? \{ \.\.\.prev, onRollContract: val \} : null\) : setSelectedOnRollContract/g, 'setSelectedOnRollContract');
    newModalCode = newModalCode.replace(/isEdit \? employee\?\.onRollContract \|\| '' : selectedOnRollContract/g, 'selectedOnRollContract');
    
    content = content + '\n' + newModalCode;
    
    // Update the usage of EmployeeModal inside EmployeeManager
    content = content.replace(
        /\{isAddModalOpen && <EmployeeModal isEdit=\{false\} \/>\}/g,
        '{isAddModalOpen && <EmployeeModal isEdit={false} onClose={() => setIsAddModalOpen(false)} onSubmit={handleAdd} sectionOptions={sectionOptions} locationOptions={locationOptions} />}'
    );
    content = content.replace(
        /\{editingEmployee && <EmployeeModal employee=\{editingEmployee\} isEdit=\{true\} \/>\}/g,
        '{editingEmployee && <EmployeeModal employee={editingEmployee} isEdit={true} onClose={() => setEditingEmployee(null)} onSubmit={handleEdit} sectionOptions={sectionOptions} locationOptions={locationOptions} />}'
    );

    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully refactored EmployeeModal out of EmployeeManager');
} else {
    console.log('Could not find EmployeeModal block');
}
