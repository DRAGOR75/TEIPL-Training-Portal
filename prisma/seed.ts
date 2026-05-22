import { PrismaClient, TrainingCategory, Grade } from '@prisma/client';
import { db as prisma } from '../lib/prisma';

const RAW_DATA = `Safety	SFT01	Behavioural Based Safety	HEMM Common
Safety	SFT02	Behavioural Based Safety (LMS)	HEMM Common
Safety	SFT03	DGMS Safety Norms 	HEMM Common
Safety	SFT04	DGMS Safety Norms (LMS)	HEMM Common
Safety	SFT05	Electrical safety	HEMM Common
Safety	SFT06	Electrical safety (LMS)	HEMM Common
Safety	SFT07	Fire Safety	HEMM Common
Safety	SFT08	Fire Safety (LMS)	HEMM Common
Safety	SFT09	HT & LT Safety	HEMM Common
Safety	SFT10	HT & LT Safety (LMS)	HEMM Common
Safety	SFT11	Hydraulic Safety	HEMM Common
Safety	SFT12	Hydraulic Safety (LMS)	HEMM Common
Safety	SFT13	LOTOTO	HEMM Common
Safety	SFT14	LOTOTO (LMS)	HEMM Common
Safety	SFT15	Mechanical Safety	HEMM Common
Safety	SFT16	Mechanical Safety (LMS)	HEMM Common
Safety	SFT17	Operator Safety  (LMS)	All Operators
Safety	SFT18	PPEs	HEMM Common
Safety	SFT19	PPEs (LMS)	HEMM Common
Safety	SFT20	EHS	All Employees
HEMM Programs	ACE01	AC Electrical - Advance  (L2)	AC Electricals HT/LT
HEMM Programs	ACE02	AC Electrical - Failure Modes & Analysis  (L3)	AC Electricals HT/LT
HEMM Programs	ACE03	Induction Motor-Operation & T/S	AC Electricals HT/LT
HEMM Programs	ACE04	Induction Motor-Operation & T/S (LMS)	AC Electricals HT/LT
HEMM Programs	ACE05	LT & HT Protection System - Operation & T/S	AC Electricals HT/LT
HEMM Programs	ACE06	LT & HT Protection System - Operation & T/S (LMS)	AC Electricals HT/LT
HEMM Programs	AEL01	Electrical Basics AC&DC - L1	Auto Electricals
HEMM Programs	AEL02	Electrical Basics AC&DC - L1(LMS)	Auto Electricals
HEMM Programs	AEL03	Auto Electrical - Failure Modes & Analysis  (L3)	Auto Electricals
HEMM Programs	AEL04	Auto Electrical - Advance - L2	Auto Electricals
HEMM Programs	AEL05	Baiscs of HEMM Sensors, Switches and Actuators	Auto Electricals
HEMM Programs	AEL06	Baiscs of HEMM Sensors, Switches and Actuators  (LMS)	Auto Electricals
HEMM Programs	AEL07	Engine Starting system  (L2)	Auto Electricals
HEMM Programs	AEL08	Engine Starting system  (L2) (LMS)	Auto Electricals
HEMM Programs	AEL09	HEMM Sensors Operation & Trouble shooting	Auto Electricals
HEMM Programs	AEL10	HEMM Sensors Operation & Trouble shooting (LMS)	Auto Electricals
HEMM Programs	AEL11	HEMM Switches  Operation & Trouble shooting	Auto Electricals
HEMM Programs	AEL12	HEMM Switches  Operation & Trouble shooting (LMS)	Auto Electricals
HEMM Programs	AEL13	PLC & Instrumentation	Crusher & Screening
HEMM Programs	CAS01	C&S Electrical - Basics and Maintenance  (L1)	Crusher & Screening
HEMM Programs	CAS02	C&S Electrical - Operation and Troubleshooting  (L2)	Crusher & Screening
HEMM Programs	CAS03	C&S Mechanical - Basics and Maintenance  (L1)	Crusher & Screening
HEMM Programs	CAS04	C&S Mechanical - Operation and Troubleshooting (L2)	Crusher & Screening
HEMM Programs	DOZ01	Dozer BEML D155, BD65-1 - L1	Dozer
HEMM Programs	DOZ02	Dozer BEML D155, BD65-1 - L2	Dozer
HEMM Programs	DOZ03	Dozer Cat D11R - L1	Dozer
HEMM Programs	DOZ04	Dozer Cat D11R - L2	Dozer
HEMM Programs	DOZ05	Dozer Komatsu D155A-5, D155A-6, D375A-5, D375A-6 - L1	Dozer
HEMM Programs	DOZ06	Dozer Komatsu D155A-5, D155A-6, D375A-5, D375A-6 - L2	Dozer
HEMM Programs	DOZ07	Dozer Komatsu D275A-5, D475A-5 - L1	Dozer
HEMM Programs	DOZ08	Dozer Komatsu D275A-5, D475A-5 - L2	Dozer
HEMM Programs	DOZ09	Dozer Komatsu D85 - L1	Dozer
HEMM Programs	DOZ10	Dozer Komatsu D85 - L2	Dozer
HEMM Programs	DOZ11	Dozer Liebherr PR 734L - L2	Dozer
HEMM Programs	DOZ12	Dozer Santui DH24B2, DH17B2 - L1	Dozer
HEMM Programs	DOZ13	Dozer Santui DH24B2, DH17B2 - L2	Dozer
HEMM Programs	DOZ14	Wheel Dozer Komatsu WD600 - L1	Dozer
HEMM Programs	DOZ15	Wheel Dozer Komatsu WD600 - L2	Dozer
HEMM Programs	DRL01	Drill - BOART LONGYEAR DB525, SHANDONG XY-3, SHANDONG XYD-3  (L2)	Drill Machines
HEMM Programs	DRL02	Drill - BOART LONGYEAR LF90D, SANDVIK DE710  (L2)	Drill Machines
HEMM Programs	DRL03	Drill - Doosan VHP 475, Doosan HP 450, IR HP 450, ELGI PG 75E  (L2)	Drill Machines
HEMM Programs	DRL04	Drill - ELGI PG 110E - 13.5-ELEC  (L2)	Drill Machines
HEMM Programs	DRL05	Drill - Revathi Drill C650E-ELEC  (L2)	Drill Machines
HEMM Programs	DRL06	Drill - SANDVIK DI550, SANDVIK DP1100, ATLASCOPCO D35, SANDVIK DX800, EPIROC PRD HC 500M, IR LM100   (L2)	Drill Machines
HEMM Programs	DUM01	Dumper Belaz 75306,75302 Electrical - L1	Dumpers
HEMM Programs	DUM02	Dumper Belaz 75306,75302 Electrical - L2	Dumpers
HEMM Programs	DUM03	Dumper Belaz 75306,75302 Mechanical - L1	Dumpers
HEMM Programs	DUM04	Dumper Belaz 75306,75302 Mechanical - L2	Dumpers
HEMM Programs	DUM05	Dumper BEML BH50M, BH40 - L1	Dumpers
HEMM Programs	DUM06	Dumper BEML BH50M, BH40 - L2	Dumpers
HEMM Programs	DUM07	Dumper CAT 773E Dumper - L1	Dumpers
HEMM Programs	DUM08	Dumper CAT 773E Dumper - L2	Dumpers
HEMM Programs	DUM09	Dumper CAT 777D Dumper - L1	Dumpers
HEMM Programs	DUM10	Dumper CAT 777D Dumper - L2	Dumpers
HEMM Programs	DUM11	Dumper Komatsu 830E-AC - L1	Elect Dumpers
HEMM Programs	DUM12	Dumper HD 785 - Brake system  (L2)	Dumpers
HEMM Programs	DUM13	Dumper Komatsu HD785-7, HD785-5 - L1	Dumpers
HEMM Programs	DUM14	Dumper Komatsu HD785-7, HD785-5 - L2	Dumpers
HEMM Programs	DUM15	Dumper Sany SKT90S,SKT105S - L1	Dumpers
HEMM Programs	DUM16	Dumper Sany SKT90S,SKT105S - L2	Dumpers
HEMM Programs	DUM17	Dumper Hitachi EH4500-Electrical - L1 	Elect Dumpers
HEMM Programs	DUM18	Dumper Hitachi EH4500-Electrical - L2 	Elect Dumpers
HEMM Programs	DUM19	Dumper Hitachi EH4500-Mechanical - L1 	Elect Dumpers
HEMM Programs	DUM20	Dumper Hitachi EH4500-Mechanical - L2	Elect Dumpers
HEMM Programs	DUM21	Dumper Hitachi EH5000-Electrical - L1	Elect Dumpers
HEMM Programs	DUM22	Dumper Hitachi EH5000-Electrical - L2	Elect Dumpers
HEMM Programs	DUM23	Dumper Hitachi EH5000-Mechanical - L1	Elect Dumpers
HEMM Programs	DUM24	Dumper Hitachi EH5000-Mechanical - L2	Elect Dumpers
HEMM Programs	DUM25	Dumper Komatsu 830E-AC - L2	Elect Dumpers
HEMM Programs	DUM26	Dumper Komatsu 830E-DC - L1	Elect Dumpers
HEMM Programs	DUM27	Dumper Komatsu 830E-DC - L2	Elect Dumpers
HEMM Programs	DUM28	Dumper Komatsu 830E-DC/AC Mechanical - L1 	Elect Dumpers
HEMM Programs	DUM29	Dumper Komatsu 830E-DC/AC Mechanical - L2	Elect Dumpers
HEMM Programs	DUM30	Dumper Sany SKT105E - L1	Elect Dumpers
HEMM Programs	DUM31	Dumper Sany SKT105E - L2	Elect Dumpers
HEMM Programs	DUM32	Dumper - Wheel Motors Rebuild (L3)	Elect Dumpers
HEMM Programs	DUM33	Final Drive - L1	Final Drive
HEMM Programs	DUM34	HEMM Final Drives Assembly - L3	Final Drive
HEMM Programs	ENG01	Diesel Engine - Fundamentals (LMS)	Diesel Engines
HEMM Programs	ENG02	Engine (L1)	Diesel Engines
HEMM Programs	ENG03	Engine (L1) (LMS)	Diesel Engines
HEMM Programs	ENG04	Engine System 	Diesel Engines
HEMM Programs	ENG05	Engine System (LMS)	Diesel Engines
HEMM Programs	ENG06	Engines OMT  (L2)	Diesel Engines
HEMM Programs	ENG07	Engine Air System Fundamental	Diesel Engines
HEMM Programs	ENG08	Engine Air System Fundamental (LMS)	Diesel Engines
HEMM Programs	ENG09	Engine Air System OMT	Diesel Engines
HEMM Programs	ENG10	Engine Air System OMT (LMS)	Diesel Engines
HEMM Programs	ENG11	Engine Failure Analysis/FIR/RCA (L3)	Diesel Engines
HEMM Programs	ENG12	Engine Fuel Systems  (L2)	Diesel Engines
HEMM Programs	ENG13	Engine Rebuild - Critical Procedures	Diesel Engines
HEMM Programs	ENG14	Engine Rebuild - Cummins K30/50  (L3)	Diesel Engines
HEMM Programs	ENG15	Engine Rebuild - Cummins QSK45/60 (L3)	Diesel Engines
HEMM Programs	ENG16	Engine Rebuild - MTU Engine (L3)	Diesel Engines
HEMM Programs	ENG17	Engine Rebuild - Volvo D13  (L3)	Diesel Engines
HEMM Programs	EXE01	Electrical Exacavator - Mechanical - L1	Excavators - Elect Drive
HEMM Programs	EXE02	Excavators - Electrical Drive Power Electricals & Controls (L3)	Excavators - Elect Drive
HEMM Programs	EXE03	Excavators - KOMATSU PC 300 ELEC	Excavators - Elect Drive
HEMM Programs	EXE04	Excavators - KOMATSU PC 3000 - L1	Excavators
HEMM Programs	EXE05	Excavators - KOMATSU PC 3000 - L2	Excavators
HEMM Programs	EXE06	Excavators - KOMATSU PC 3000 ELEC - L1	Excavators - Elect Drive
HEMM Programs	EXE07	Excavators - KOMATSU PC 3000 ELEC - L2	Excavators - Elect Drive
HEMM Programs	EXE08	Excavators - TATA HITACHI EX 2500 ELEC - L1	Excavators - Elect Drive
HEMM Programs	EXE09	Excavators - TATA HITACHI EX 2500 ELEC - L2	Excavators - Elect Drive
HEMM Programs	EXE10	Excavators - TATA HITACHI EX1200-ELEC - L1	Excavators - Elect Drive
HEMM Programs	EXE11	Excavators - TATA HITACHI EX1200-ELEC - L2	Excavators - Elect Drive
HEMM Programs	EXE12	Excavators - TATA HITACHI EX1200-Mechanical - L1	Excavators - Elect Drive
HEMM Programs	EXE13	Excavators - TATA HITACHI EX1200-Mechanical - L2	Excavators - Elect Drive
HEMM Programs	EXE14	Excavators - TEREX RH340B, RH120E - L1	Excavators - Elect Drive
HEMM Programs	EXE15	Excavators - TEREX RH340B, RH120E - L2	Excavators - Elect Drive
HEMM Programs	EXE16	Excavators - TATA HITACHI EX110-ELEC	Excavators - Elect Drive
HEMM Programs	EXE17	Excavators - JCB NXT215LC	Excavators
HEMM Programs	EXE18	Komatsu Excavator Hydraulics  (L2)	Excavators
HEMM Programs	EXE19	Komatsu Excavators Comparison  (L1)	Excavators
HEMM Programs	EXE20	Komatsu Excavators - Pressure and Flow Testing & Adjustment (L3)	Excavators
HEMM Programs	EXE21	Excavators - KOMATSU PC210, PC300, PC450 - L1	Excavators
HEMM Programs	EXE22	Excavators - KOMATSU PC210, PC300, PC450 - L2	Excavators
HEMM Programs	EXE23	Excavators - Liebherr A920	Excavators
HEMM Programs	EXE24	Excavators - Liebherr R996 Elect - L1	Excavators
HEMM Programs	EXE25	Excavators - Liebherr R996 Elect - L2	Excavators
HEMM Programs	EXE26	Excavators - Liebherr R996, R984, R9350 - L1	Excavators
HEMM Programs	EXE27	Excavators - Liebherr R996, R984, R9350 - L2	Excavators
HEMM Programs	EXE28	Excavators - SANY SY870-10HD (L1)	Excavators
HEMM Programs	EXE29	Excavators - TATA HITACHI ZX650,470,450, 870H-3,3F,5G	Excavators
HEMM Programs	EXE30	Excavators - TATA HITACHI 70, 110,220,210, 370 - L1	Excavators
HEMM Programs	EXE31	Excavators - TATA HITACHI 70, 110,220,210, 370 - L2	Excavators
HEMM Programs	EXE32	Excavators - TATA HITACHI EX1200,2500	Excavators
HEMM Programs	EXE33	Excavators - TATA HITACHI ZX670 - L1	Excavators
HEMM Programs	EXE34	Excavators - TATA HITACHI ZX670 - L2	Excavators
HEMM Programs	EXE35	Excavators - VOLVO EC300, EC290, EC210	Excavators
HEMM Programs	EXE36	Excavators - VOLVO EC750, EC700	Excavators
HEMM Programs	EXE37	Hitachi Excavator Hydraulics  (L2)	Excavators
HEMM Programs	EXE38	Hitachi Excavators - Pressure and Flow Testing & Adjustment (L3)	Excavators
HEMM Programs	GRA01	Graders - BEML BG825	Graders
HEMM Programs	GRA02	Graders - CASE 865-C	Graders
HEMM Programs	GRA03	Graders - Cat 24H	Graders
HEMM Programs	GRA04	Graders - Basics and Maintenance  (L1)	Graders
HEMM Programs	GRA05	Graders - Operation and Troubleshooting  (L2)	Graders
HEMM Programs	GRA06	Grader Komatsu GD825, GD535, GD 705, GD511	Graders
HEMM Programs	GRA07	Grader Sany SMG200	Graders
HEMM Programs	GRA08	Graders Volvo G930	Graders
HEMM Programs	HEM01	Auto Fire Detection and Supression System -AFDSS - L2	HEMM Common
HEMM Programs	HEM02	Auto Lubrication System - ALS - Lincoln L2	HEMM Common
HEMM Programs	HEM03	Fuel Consumption	HEMM Common
HEMM Programs	HEM04	Gears - Basics, Types, Maintenace,Failures	HEMM Common
HEMM Programs	HEM05	HEMM Air Conditioners OMT	HEMM Common
HEMM Programs	HEM06	HEMM Fundamentals (Eng, Hyd, Elect etc.)	HEMM Common
HEMM Programs	HEM07	HEMM Fundamentals (LMS)	HEMM Common
HEMM Programs	HEM08	HEMM Maintenance & Adverse Effects of Wrong practices	HEMM Common
HEMM Programs	HEM09	HEMM Mining Machinery - (L1)	HEMM Common
HEMM Programs	HEM10	HEMM Mining Machinery - (L2)	HEMM Common
HEMM Programs	HEM11	HEMM Troubleshooting - Engine, Hydraulics, Auto Elect  (L2)	HEMM Common
HEMM Programs	HEM12	Hoses Fitment Guidelines (L1)	HEMM Common
HEMM Programs	HEM13	Hoses Fitment Guidelines (L1) (LMS)	HEMM Common
HEMM Programs	HEM14	Inventory & Store/Warehouse Management	Procurement & Warehouse
HEMM Programs	HEM15	Lubricants Management (L1)	HEMM Common
HEMM Programs	HEM16	Lubricants Management (LMS)	HEMM Common
HEMM Programs	HEM17	Lubricants Technology (L2)	HEMM Common
HEMM Programs	HEM18	Lubricants Technology (LMS)	HEMM Common
HEMM Programs	HEM19	Maintenance Planning and Budgeting	Planning Team - Mtc
HEMM Programs	HEM20	Parts Quality & supplier warranty	Procurement & Warehouse
HEMM Programs	HEM21	Planning Engineer	Planning Team - Mtc
HEMM Programs	HEM22	Procurement Planning & Inventory management	Procurement & Warehouse
HEMM Programs	HEM23	Procurement Processes	Procurement & Warehouse
HEMM Programs	HEM24	RCA / FMEA - Reliability Centered Maintenance	Planning Team - Mtc
HEMM Programs	HEM25	Tools, Measuring Instruments  (L0)	HEMM Common
HEMM Programs	HEM26	Tyre Failures and Maintenance	Tyres
HEMM Programs	HEM27	Undercarriage & GETs	HEMM Common
HEMM Programs	HEM28	Units and Conversion  (L0)	HEMM Common
HEMM Programs	HEM29	Welding	Welding
HEMM Programs	HYD01	Failure Analysis & FIR - Hydraulics (L3)	Hydraulics Repairs
HEMM Programs	HYD02	Hydraulic Troubleshooting	Hydraulics Repairs
HEMM Programs	HYD03	Hydraulics Component Rebuild	Hydraulics Repairs
HEMM Programs	HYD04	Hydraulics Fundamentals - L1	Hydraulics Repairs
HEMM Programs	HYD05	Hydraulics Fundamentals (LMS)	Hydraulics Repairs
HEMM Programs	LMV01	LMV - L1	Light Motor Vehicle
HEMM Programs	LMV02	LMV - L2	Light Motor Vehicle
HEMM Programs	LOD01	Loader HM	Wheel Loader
HEMM Programs	LOD02	Loader KOMATSU WA800-3, WA470 - L1	Wheel Loader
HEMM Programs	LOD03	Loader KOMATSU WA800-3, WA470 - L1	Wheel Loader
HEMM Programs	LOD04	Loader KOMATSU WA800-3, WA470 - L2	Wheel Loader
HEMM Programs	LOD05	Loader Liugong CLG 856HE-ELECT - L1	Wheel Loaders Electrical
HEMM Programs	LOD06	Loader Liugong CLG 856HE-ELECT - L2	Wheel Loaders Electrical
HEMM Programs	LOD07	Loader SDLG - Basics and Maintenance (L1)	Wheel Loader
HEMM Programs	LOD08	Loader SDLG - Operation and Troubleshooting  (L2)	Wheel Loader
HEMM Programs	LOD09	Loader SDLG L958H, L958F,L 956H,LG958L - L1	Wheel Loader
HEMM Programs	LOD10	Loader SDLG L958H, L958F,L 956H,LG958L - L2	Wheel Loader
HEMM Programs	LOD11	Loader Volvo JL120 Electrical (L2)	Wheel Loaders Electrical
HEMM Programs	LOD12	Loader Volvo L220G, L220H - L1	Wheel Loader
HEMM Programs	LOD13	Loader Volvo L220G, L220H - L2	Wheel Loader
HEMM Programs	LOD14	Loader XCMG ZL50G	Wheel Loader
HEMM Programs	OTH02	Diesel Generator O/M/T  (L2)	Diesel Generator
HEMM Programs	ROP01	Rope shovels P&H2100BL - L1	Rope Shovels
HEMM Programs	ROP02	Rope shovels P&H2100BL - L2	Rope Shovels
HEMM Programs	TRK01	Trucks Scania P440, Eicher Pro 8035 Xm - L1	Trucks
HEMM Programs	TRK02	Trucks Scania P440, Eicher Pro 8035 Xm - L2	Trucks
HEMM Programs	TRK03	Trucks Volvo FM400, FMX440, FMX460, FMX480 - L1	Trucks
HEMM Programs	TRK04	Trucks Volvo FM400, FMX440, FMX460, FMX480 - L2	Trucks
HEMM Programs	TRN01	HEMM Powertrain - L2	Transmission Rebuilt
HEMM Programs	TRN02	Transmission Basics and Maintenance - L1	Transmission Rebuilt
HEMM Programs	TRN03	Transmission Rebuild _Komatsu	Transmission Rebuilt
HEMM Programs	TRN04	Transmission Rebuild _Volvo	Transmission Rebuilt
Behavioral Programs	BEH01	Campus to Corporate	All Freshers 
Behavioral Programs	BEH02	Seven (7) Habits	All Managers/ HODs
Behavioral Programs	BEH03	Managerial Effectiveness Training	All Managers/ HODs
Behavioral Programs	BEH04	Psychological Safety	All Managers/ HODs
Behavioral Programs	BEH05	The art of communication & presentation skills	All Managers/ HODs
Behavioral Programs	BEH06	The Shift	All Managers/ HODs
Behavioral Programs	BEH07	Personality Development for Workmen	All Workman
Behavioral Programs	BEH08	Connect & Grow	All Workman
Behavioral Programs	BEH09	Decision Making (LMS)	All Managers/ HODs
Behavioral Programs	BEH10	Email Etiquettes	All Employees
Behavioral Programs	BEH11	Email Etiquettes (LMS)	All Employees
Behavioral Programs	BEH12	POSH	All Employees
Behavioral Programs	BEH13	POSH (LMS)	All Employees
Behavioral Programs	BEH14	Presentation Skills (LMS)	All Employees
Behavioral Programs	BEH15	Stress Management	All Employees
Behavioral Programs	BEH16	Stress Management (LMS)	All Employees
Behavioral Programs	BEH17	Team work (LMS)	All Employees
Behavioral Programs	BEH18	Time Management (LMS)	All Employees
Behavioral Programs	BEH19	Brand Sarthi	Driver
Behavioral Programs	BEH20	Training of Trainers	Trainers
Operators	OPE01	Operator - Drill Rigs	All Operators
Operators	OPE02	Operator - Dumpers	All Operators
Operators	OPE03	Operator - Excavators	All Operators
Operators	OPE04	Operator - Grader	All Operators
Operators	OPE05	Operator - Loaders	All Operators
Operators	OPE06	Operator - Volvo Truck	All Operators
Other Functions	COM01	Firewall	Computers & IT
Other Functions	COM02	Network Integration	Computers & IT
Other Functions	HRI01	Contract management	HR /IR
Other Functions	HRI02	Laws and Regulations	HR /IR
Other Functions	HRI03	Lesioning procedures / Contract Management	HR /IR
Other Functions	HRI04	Shift management, Leave management	HR /IR
Other Functions	MNG01	Drone Survey Surpac Software	Mining Production
Other Functions	MNG02	Fleet Management	Mining Production
Other Functions	MNG03	Legislative knowledge of mining operations	Mining Production
Other Functions	MNG04	Mining Foreman	Mining Production
Other Functions	MNG05	Mining Mate	Mining Production
Other Functions	OPE07	Train the Trainers	Trainers
Other Functions	OTH01	Auto CAD	Design & Development
Other Functions	OTH04	Finance for non finance	All Managers/ HODs
Other Functions	OTH05	First Aid (LMS)	All Employees
Other Functions	OTH06	Google Drive	All Employees
Other Functions	OTH07	Google Drive (LMS)	All Employees
Other Functions	OTH08	Google Meets, Zoom, MS Team	All Employees
Other Functions	OTH09	Google Sheets	All Employees
Other Functions	OTH10	Google Sheets (LMS)	All Employees
Other Functions	OTH11	Kaizen / 5S  (LMS)	All Employees
Other Functions	OTH12	MIS	All Employees
Other Functions	OTH13	MS Office (Word, Excel, Powerpoint)	All Employees
Other Functions	OTH14	Online IT Service Processes	All Employees
Other Functions	OTH15	SAP	All Employees
Other Functions	OTH16	Six Sigma	All Managers/ HODs
Other Functions	OTH17	Thriveni Corporate induction	All Employees`;

function parseData() {
    const lines = RAW_DATA.trim().split('\n');
    const programs: any[] = [];
    
    for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split('\t');
        if (parts.length < 4) continue;
        
        const [group, code, name, section] = parts;
        
        let category = 'OTHER_PROGRAMS';
        if (group === 'Safety') category = 'SAFETY_PROGRAMS';
        else if (group === 'HEMM Programs') category = 'HEMM_PROGRAMS';
        else if (group === 'Behavioral Programs') category = 'BEHAVIOURAL_PROGRAMS';
        else if (group === 'Operators') category = 'OPERATOR_PROGRAMS';
        else if (group === 'Other Functions') category = 'OTHER_PROGRAMS';
        
        let finalSection = section.trim();
        // Clear sections that represent "everyone" to keep them available globally
        const lowerSection = finalSection.toLowerCase();
        if (lowerSection.startsWith('all ') || lowerSection === 'trainers' || lowerSection === 'driver') {
             finalSection = '';
        }
        
        programs.push({ name: name.trim(), category, section: finalSection });
    }
    return programs;
}

async function main() {
    console.log('🚀 Starting deep seed process...');
    const PROGRAM_DATA = parseData();

    // 1. Sections
    const uniqueSectionNames = Array.from(new Set(PROGRAM_DATA.map(p => p.section).filter(Boolean)));
    const sectionMap = new Map<string, string>();

    console.log(`📂 Ensuring ${uniqueSectionNames.length} sections...`);
    for (const name of uniqueSectionNames) {
        const sec = await prisma.section.upsert({
            where: { name },
            update: {},
            create: { name }
        });
        sectionMap.set(name, sec.id);
    }

    // 2. Programs
    console.log(`📝 Ensuring ${PROGRAM_DATA.length} programs...`);
    for (const p of PROGRAM_DATA) {
        const sectionData = p.section ? { connect: [{ id: sectionMap.get(p.section) }] } : undefined;
        
        await prisma.program.upsert({
            where: { name: p.name },
            update: {
                category: p.category as TrainingCategory,
                sections: p.section ? { set: [{ id: sectionMap.get(p.section) }] } : { set: [] }
            },
            create: {
                name: p.name,
                category: p.category as TrainingCategory,
                targetGrades: [Grade.EXECUTIVE, Grade.WORKMAN],
                sections: sectionData
            }
        });
    }

    console.log(`✅ Success! Seeded ${PROGRAM_DATA.length} programs across ${uniqueSectionNames.length} sections.`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Error during seeding:', e);
        await prisma.$disconnect();
        process.exit(1);
    });