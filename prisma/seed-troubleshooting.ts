import { PrismaClient } from '@prisma/client';
import Papa from 'papaparse';

const prisma = new PrismaClient();

// --- 1. Products Data ---
const products = [
    { id: 1, name: "Cummins Engines", viewSeq: 2, userView: -1 },
    { id: 2, name: "Excavators", viewSeq: 3, userView: -1 },
    { id: 3, name: "Liebherr R 996B", viewSeq: 4, userView: -1 },
    { id: 4, name: "CAT D11 R", viewSeq: 5, userView: 0 },
    { id: 5, name: "CAT Engines", viewSeq: 6, userView: 0 },
    { id: 6, name: "EX 2500", viewSeq: 7, userView: 0 },
    { id: 7, name: "Komatsu HD 785", viewSeq: 8, userView: 0 },
    { id: 8, name: "Komatsu HD 830", viewSeq: 9, userView: 0 },
    { id: 9, name: "Alternator Genset", viewSeq: 10, userView: 0 },
    { id: 10, name: "Liebherr R 9350", viewSeq: 11, userView: 0 },
    { id: 11, name: "Liebherr R 996", viewSeq: 12, userView: 0 },
    { id: 12, name: "Liebherr R 9350E", viewSeq: 13, userView: 0 },
    { id: 13, name: "Hydraulics Faults", viewSeq: 14, userView: 0 },
    { id: 14, name: "Electical Faults", viewSeq: 15, userView: 0 },
    { id: 15, name: "Fault Finding Guidelines", viewSeq: 2, userView: 0 },
    { id: 16, name: "Cummins Alternators", viewSeq: 16, userView: -1 },
];

// --- 2. Faults Data (Original ID needed for linking) ---
const faults = [
    { id: 1, prodId: 2, seq: 1, name: "Engine Will Not Crank Or Cranks Slowly" },
    { id: 2, prodId: 2, seq: 1, name: "Engine Cranks But will not Start - No smoke Exhaust" },
    { id: 3, prodId: 2, seq: 2, name: "Engine Hard to Start or will not start Smoke From" },
    { id: 4, prodId: 2, seq: 2, name: "Engine Starts But Will Not Keep Running" },
    { id: 5, prodId: 2, seq: 3, name: "Engine Surging (Speed Change)" },
    { id: 6, prodId: 2, seq: 3, name: "Engine Idle Rough Irregularly firing or Engine Shaking" },
    { id: 7, prodId: 2, seq: 4, name: "Engine Runs Rough Or Misfiring" },
    { id: 8, prodId: 2, seq: 4, name: "Engine RPM will not Reach Rated Speed" },
    { id: 9, prodId: 2, seq: 5, name: "Engine Power Output Low" },
    { id: 10, prodId: 2, seq: 5, name: "Exhaust Black Smoke Excessive" },
    { id: 11, prodId: 2, seq: 6, name: "Exhaust White Smoke Excessive" },
    { id: 12, prodId: 2, seq: 6, name: "Coolant Temperature Above normal- Gradual Overheat" },
    { id: 13, prodId: 2, seq: 7, name: "Coolant Temperature Above Normal - Sudden Overheat" },
    { id: 14, prodId: 2, seq: 7, name: "Coolant Temperature Below Normal" },
    { id: 15, prodId: 2, seq: 8, name: "Coolant Loss" },
    { id: 16, prodId: 2, seq: 8, name: "Lubricating Oil Pressure Low" },
    { id: 17, prodId: 2, seq: 9, name: "Lubricating Oil Pressure High" },
    { id: 18, prodId: 2, seq: 9, name: "Lubricating Oil Consumption Excessive" },
    { id: 19, prodId: 2, seq: 10, name: "Coolant Contaminated" },
    { id: 20, prodId: 2, seq: 10, name: "Lubricating Oil Contaminated" },
    { id: 21, prodId: 2, seq: 11, name: "Fuel or Oil Leaking From Exhaust Manifold" },
    { id: 22, prodId: 2, seq: 11, name: "Compression Knocks" },
    { id: 23, prodId: 2, seq: 12, name: "Fuel Consumption Excessive" },
    { id: 24, prodId: 2, seq: 13, name: "Engine Will Not Shut Off" },
    { id: 25, prodId: 2, seq: 12, name: "Engine Vibration Excessive" },
    { id: 26, prodId: 2, seq: 14, name: "Engine Noises Excessive" },
    { id: 27, prodId: 2, seq: 15, name: "Alternator Not Charging Or Insufficient Charging" },
    { id: 28, prodId: 2, seq: 13, name: "Ususal Smoke and power loss" },
    { id: 29, prodId: 2, seq: 16, name: "Unusual smoke power loss connected with usual noise" },
    { id: 41, prodId: 2, seq: 17, name: "Engine Will Not Crank Or Cranks Slowly" },
    { id: 42, prodId: 16, seq: 14, name: "No Voltage buildup" },
    { id: 43, prodId: 16, seq: 18, name: "Low No-Load Voltage" },
    { id: 44, prodId: 16, seq: 19, name: "Low voltage on load" },
    { id: 45, prodId: 16, seq: 20, name: "High Voltage on Load" },
    { id: 46, prodId: 16, seq: 21, name: "High Voltage on NoLoad" },
    { id: 47, prodId: 16, seq: 15, name: "Voltage oscillations" },
    { id: 48, prodId: 16, seq: 22, name: "Unbalance Voltage" },
    { id: 49, prodId: 16, seq: 16, name: "Overheating of bearings (temp. of bearings over 80 digree sentigrade)(with of without noise)" },
    { id: 50, prodId: 16, seq: 23, name: "Excessive overheating of alternator Frame" },
    { id: 51, prodId: 16, seq: 17, name: "Excessive Vibration and humming noise" },
    { id: 52, prodId: 16, seq: 24, name: "Smokes , sparks or flames coming from the alternator" },
    { id: 53, prodId: 16, seq: 18, name: "Alternator damaged by a significant impact followed by vibration" },
];

// --- 3. Causes CSV Data ---
// CauseID, FaultID, CauseViewSeq, Possible Causes, Divert, Action, Symptoms, Ref, UserView
const causesCSV = `1	1	1	Starting Motor Operating But Not Cranking the Engine.	10	Remove the starting motor and check for broken teeth on the ring gear or broken starting motor spring.	>>-- Sample Text	Link file	-1
2	1	2	Starting Circuit Connections Loose or Corroded.	10	Clean and tighten connections.	>>-- Sample Text	Link file	-1
3	1	3	Battery Charge Low.	10	Check battery voltage, electrolyte & charge if necessary.	>>-- Sample Text	Link file	-1
4	1	4	No Voltage to Starter Solenoid.	10	Check the connection & rectify the defects.	>>-- Sample Text	Link file	-1
5	1	5	Crankshaft Rotation Restricted.	10	Establish the causes and rectify the defects.	>>-- Sample Text	Link file	-1
6	1	6	Solenoid or Starting Motor Malfunction.	15	Find out the cause rectify the defects or replace starter motor if required.	>>-- Sample Text	Link file	-1
7	2	1	No Fuel in Supply tank.	15	Check / replace fuel supply	>>-- Sample Text	Link file	-1
8	2	2	Electrical or Manual Fuel Shut off Not Open.	15	Check for loose wires and verify that the valve is functioning Check to be sure manual shutoff lever is in the run position.	>>-- Sample Text	Link file	-1
9	2	3	Improper Starting Procedure.	15	Verify proper starting procedure.	>>-- Sample Text	Link file	-1
10	2	5	Inspect Fuel Transfer Pump Operation.	15	Inspect as per specified procedure & take necessary action.	>>-- Sample Text	Link file	-1
11	2	6	Fuel Injection Pump Not Getting Fuel or Fuel is Aerated.	15	Check for any leakages in the return side of F.I.P. Check for condition of fuel filter, replace if nescessary. Bleed the fuel system.	>>-- Sample Text	Link file	-1
12	2	8	Air Intake or Exhaust System Plugged.	15	Check for the restrictions in the Air intake circuit including the clogged filters and also the exhaust system including the engine exhaust brake butterfly valve & clogging of silencer & take corrective action.	>>-- Sample Text	Link file	-1
13	2	9	Fuel Drain Back.	15	Verify that the return line is plumbed to the bottom of the fuel tank.	>>-- Sample Text	Link file	-1
14	2	10	Malfunctioning Fuel Return Overflow Valve.	15	Check/ replace return overflow valve.	>>-- Sample Text	Link file	-1
15	2	11	Worn or Malfunctioning Fuel Injection Pump.	15	Get Fuel injection pump checked and rectified at authorized Fuel Injection Pump dealer.	>>-- Sample Text	Link file	-1
16	2	12	Injection Pump Timing Incorrect.	15	Verify the Fuel Injection timing and correct the same if found incorrect.	>>-- Sample Text	Link file	-1
17	2	13	Engine Camshaft Out of Time.	15	Check/correct gear train timing alignment.	>>-- Sample Text	Link file	-1
18	3	1	Starting Procedure Incorrect.	15	Refer to the Operation and Maintenance Manual.	>>-- Sample Text	Link file	-1
19	3	5	Intake Air Insufficient.	15	Inspect all passages / tubes with air filter assembly, replace the air filter if required.	>>-- Sample Text	Link file	-1
20	3	6	Air in the Fuel System or the Fuel Supply Inadequate.	15	Check all the fuel filters of the system. proper tightening of connections specially of suction side and also for the puncture of the suction tube etc.	>>-- Sample Text	Link file	-1
21	3	7	Fuel is Contaminated.	15	Verify by operating the engine with clean fuel from a temporary tank on No. 2 diesel fuel. Checked the fuel contaminate properly / completely drain out the contaminated fuel from the tank and get the entire fuel system flushed . Use clean uncontaminated f	>>-- Sample Text	Link file	-1
22	3	8	Fuel Drain Back.	15	Verify fuel return line is plumbed to bottom of fuel tank.	>>-- Sample Text	Link file	-1
23	3	0	Malfunctioning Fuel Return Overflow Valve.	15	Check/replace return overflow valve.	>>-- Sample Text	Link file	-1
24	3	11	Fuel Injection Pump Out of Time.	15	Check/adjust inspection pump timing.	>>-- Sample Text	Link file	-1
25	3	12	Valves Incorrectly Adjusted.	15	Adjust valves.	>>-- Sample Text	Link file	-1
26	3	13	One or More Injectors Worn or Malfunctioning.	15	Check/replace injectors.	>>-- Sample Text	Link file	-1
27	3	14	Engine Compression Low.	15	Perform a compression check to identify the problem.	>>-- Sample Text	Link file	-1
28	3	15	Fuel Injection Pump /Delivery Valves Malfunctioning.	15	Remove fuel injection pump. Have calibration checked.	>>-- Sample Text	Link file	-1
29	4	1	Low Fuel Level.	15	Check/fill fuel tank	>>-- Sample Text	Link file	-1
30	4	2	Engine Starting Under Load.	15	Disengage driven units.	>>-- Sample Text	Link file	-1
31	4	3	Idle Speed Too Low for Accessories.	15	Adjust the idle speed.	>>-- Sample Text	Link file	-1
32	4	4	Intake Air or Exhaust System Restricted.	15	Visually check for exhaust restriction and inspect the air intake.	>>-- Sample Text	Link file	-1
33	4	5	Air in the Fuel System or the Fuel Supply is Inadequate.	15	Check the flow through the filter and bleed the system. Locate and correct the air source.	>>-- Sample Text	Link file	-1
34	4	6	Fuel Waxing Due to Extremely Cold Weather.	15	Verify by inspecting the fuel filter. Clean the system and use climatized fuel.	>>-- Sample Text	Link file	-1
35	4	7	Fuel Contaminated.	15	Verify by operating the engine with clean fuel from a temporary supply tank. Drain and flush the fuel supply tank.	>>-- Sample Text	Link file	-1
36	4	8	Plugged Fuel Filter.	15	Check/replace filter.	>>-- Sample Text	Link file	-1
37	5	1	Fuel Level Low.	15	Check/fill fuel tank.	>>-- Sample Text	Link file	-1
38	5	2	The Idle Speed Set Too Low for Accessories.	15	Adjust the idle.	>>-- Sample Text	Link file	-1
39	5	3	Throttle Linkage Misadjusted or Damaged.	15	Adjust or repair linkage.	>>-- Sample Text	Link file	-1
40	5	4	High Pressure Fuel Leak.	20	Inspect/correct leaks in the high pressure lines, fittings, injector sealing washers or delivery valves.	>>-- Sample Text	Link file	-1
41	5	5	Aerated Fuel.	20	Bleed the fuel system and correct source of the leak.	>>-- Sample Text	Link file	-1
42	5	6	One or More Injectors Worn or Malfunctioning.	20	Check/replace the injectors.	>>-- Sample Text	Link file	-1
43	5	7	Fuel Injection Pump /Delivery Valves Malfunctioning.	20	Remove fuel injection pump. Have calibration checked.	>>-- Sample Text	Link file	-1
44	6	2	Idle Speed Too Low for the Accessories.	20	Check/ adjust low idle screw.	>>-- Sample Text	Link file	-1
45	6	3	Engine Mounts Over-Tightened, Damaged or Loose.	20	Verify condition of mounts.	>>-- Sample Text	Link file	-1
46	6	4	High Pressure Fuel Leak.	20	Inspect/ correct leaks in the high pressure lines, fittings, injection sealing washers or delivery valve seals.	>>-- Sample Text	Link file	-1
47	6	5	Air in the Fuel System.	20	Bleed the fuel system and correct the source of the air.	>>-- Sample Text	Link file	-1
48	6	6	Fuel Return Overflow Valve Malfunctioning.	20	Check/ replace fuel return overflow valve.	>>-- Sample Text	Link file	-1
49	6	8	Fuel Supply Restricted.	20	Clean pre-filters and screens and check fuel line for restriction. Replace fuel filter.	>>-- Sample Text	Link file	-1
50	6	9	Injector Needle Valve Sticking.	20	Check/replace the injector.	>>-- Sample Text	Link file	-1
51	6	10	Fuel Injector Pump or Delivery Valve Malfunctioning.	20	Remove fuel injection pump. Have calibration checked.	>>-- Sample Text	Link file	-1
52	6	11	Valves Not Sealing.	20	Adjust valve and check, if complaint still exist check the valve seats and take corrective action.	>>-- Sample Text	Link file	-1
53	6	12	Compression in One or More Cylinders Low.	20	Perform a compression check and repair as required.	>>-- Sample Text	Link file	-1
54	7	1	Condition only Occurs at Idle.	20	Adjust idle speed.	>>-- Sample Text	Link file	-1
55	7	2	Engine is Cold.	20	Allow engine to warm to operating temperature.	>>-- Sample Text	Link file	-1
56	7	3	Fuel Injection Lines Leaking.	20	Inspect/correct leaks in the high pressure lines, fittings injector sealing washers, or delivery valves.	>>-- Sample Text	Link file	-1
57	7	4	Air in the Fuel or the Fuel Supply is Inadequate.	20	Check the flow through the filter and bleed the system. Locate and correct the air source.	>>-- Sample Text	Link file	-1
58	7	5	Malfunctioning Fuel Return Overflow Valve.	20	Check/replace return overflow valve.	>>-- Sample Text	Link file	-1
59	7	7	Fuel Supply Restricted.	20	Clean pre-filters and screens and check fuel line restriction. Replace fuel filter.	>>-- Sample Text	Link file	-1
60	7	8	Fuel Contaminated.	20	Verify by operating the engine with clean fuel from a temporary tank. Checked the fuel contaminate properly / completely drain out the contaminated fuel from the tank and get the entire fuel system flushed .Use clean uncontaminated fuel only.	>>-- Sample Text	Link file	-1
61	7	9	Valve Adjustment Incorrect.	20	Check for a bent push rod and adjust valves.	>>-- Sample Text	Link file	-1
62	7	10	Injection Pump Timing Incorrectly Adjusted.	20	Check top dead center (TDC) check/adjust injection pump timing. Check/time the fuel injection pump using the spill port timing if equipment is available.	>>-- Sample Text	Link file	-1
63	7	11	Compression in One or More Cylinders Low.	20	Perform a compression and repair as required.	>>-- Sample Text	Link file	-1
64	7	12	Injectors Malfunctioning.	20	Check/replace injectors.	>>-- Sample Text	Link file	-1
65	7	13	Injection Pump (Delivery Valves) Defective.	20	Remove fuel injection pump. Have calibration checked.	>>-- Sample Text	Link file	-1
66	7	14	Camshaft Out of Time.	20	Check/correct gear train timing alignment.	>>-- Sample Text	Link file	-1
67	7	15	Camshaft or Tappets Damaged.	20	Inspect camshaft and tappets.	>>-- Sample Text	Link file	-1
68	8	1	Tachometer Malfunctioning.	20	Verify engine speed with hand tachometer. Correct as required.	>>-- Sample Text	Link file	-1
69	8	2	Engine Overloaded.	20	Verify high idle speed without load. Investigate operation to be sure correct gear is being used.	>>-- Sample Text	Link file	-1
70	8	3	Throttle Linkage Worn or Incorrectly Adjusted.	20	Adjust linkage for stop-to-stop fuel control lever travel.	>>-- Sample Text	Link file	-1
71	8	4	Mechanical Shut off Lever Partially Engaged.	20	Check/place shutoff lever in run position.	>>-- Sample Text	Link file	-1
72	8	5	Fuel Quality Poor.	20	Verify by operating the engine from a temporary tank of No.2 diesel fuel. Refer to the " Fuel Recommendations/ Specifications"	>>-- Sample Text	Link file	-1
73	8	6	Fuel Supply Inadequate.	20	Check the flow through the filter to locate the source of the restriction.	>>-- Sample Text	Link file	-1
74	8	7	Fuel Return Overflow Valve Malfunctioning.	20	Check/replace fuel return overflow valve.	>>-- Sample Text	Link file	-1
75	8	11	Fuel Injection Pump Malfunctioning.	20	Remove fuel injection pump. Have calibration checked.	>>-- Sample Text	Link file	-1
76	9	1	Engine Overloaded.	20	Check for added loading from malfunctioning accessories or driven units, brakes dragging and other changes in vehicle loading.	>>-- Sample Text	Link file	-1
77	9	2	Fuel Control Lever Misadjusted.	20	Check/correct for stop-to-stop travel.	>>-- Sample Text	Link file	-1
78	9	3	Mechanical/Shutoff Lever Partially Engaged.	20	Check/replace shutoff lever in run position.	>>-- Sample Text	Link file	-1
79	9	4	Fuel Quality Poor.	20	Verify by operating the engine from a temporary tank of No. 2 diesel fuel.	>>-- Sample Text	Link file	-1
80	9	7	High Pressure Fuel Leak.	20	Inspect/correct leaks in the high pressure lines, fittings injector sealing washers or delivery valve seals.	>>-- Sample Text	Link file	-1
81	9	8	Fuel Supply Inadequate.	20	Check the flow through the filter to locate the source of the restriction.	>>-- Sample Text	Link file	-1
82	9	9	Air in the Fuel System.	20	Bleed the fuel system and check for suction leaks.	>>-- Sample Text	Link file	-1
83	9	11	Malfunctioning Fuel Return Overflow Valve.	20	Check/ replace return overflow valve.	>>-- Sample Text	Link file	-1
84	9	12	Oil Level Incorrect.	20	Check/correct oil level.	>>-- Sample Text	Link file	-1
85	9	13	Intake Air Inadequate or Overheated.	20	Inspect/replace air cleaner element Look for other restrictions. Check charge air cooler for internal restriction. Replace restricted cooler.Check/clean debris from front of charge air cooler.	>>-- Sample Text	Link file	-1
86	9	15	Exhaust Restriction.	20	Check/correct exhaust system.	>>-- Sample Text	Link file	-1
87	9	17	Exhaust Leak at the Manifold or Turbocharger.	20	Check/ Correct leaks in the manifold or turbocharger gaskets. Look for a cracked manifold.	>>-- Sample Text	Link file	-1
88	9	18	Extra Injector Sealing Washer Installed Under Injector.	20	Remove extra injector sealing washer.	>>-- Sample Text	Link file	-1
89	9	19	Injector Worn or Malfunctioning.	20	Investigate reasons for engine overheating and rectify the defects.	>>-- Sample Text	Link file	-1
90	9	21	Valve Clearances Incorrect.	20	Check/adjust valves.	>>-- Sample Text	Link file	-1
91	9	22	Fuel Injection Pump Timing Incorrect.	20	Check/time fuel injection pump.	>>-- Sample Text	Link file	-1
92	9	23	Fuel Injection Pump Malfunctioning.	20	Remove fuel injection pump. Have calibration checked.	>>-- Sample Text	Link file	-1
93	9	24	Engine Compression Low.	20	Perform compression check to identify malfunction. Correct as required.	>>-- Sample Text	Link file	-1
94	10	1	Engine Being Lugged Down.	20	Use lower gear.	>>-- Sample Text	Link file	-1
95	10	2	Intake Air Restricted.	20	Inspect/charge air cleaner. Look for other restrictions.	>>-- Sample Text	Link file	-1
96	10	3	Exhaust Restriction.	20	Check exhaust restriction.	>>-- Sample Text	Link file	-1
97	10	8	Turbocharger Malfunctioning.	20	Inspect/replace turbocharger.	>>-- Sample Text	Link file	-1
98	10	9	Injector Installed with more than One Sealing Washer.	20	Remove extra washer.	>>-- Sample Text	Link file	-1
99	10	10	Injectors Malfunctioning.	20	Replace injectors.	>>-- Sample Text	Link file	-1
100	10	11	Fuel Injection Pump Malfunctioning or Over fueled.	20	Remove fuel injection pump. Have calibration checked.	>>-- Sample Text	Link file	-1
101	10	12	Piston Rings Not Sealing (Blue Smoke).	20	Perform a compression check. Correct as required.	>>-- Sample Text	Link file	-1
102	10	13	Fuel Injection Pump Timing Incorrect.	20	Check/time fuel injection pump.	>>-- Sample Text	Link file	-1
103	11	1	Improper Starting Procedure.	20	Verify proper starting procedure.	>>-- Sample Text	Link file	-1
104	11	2	Coolant Temperature Too Low.	20	Check/Replace thermostat.	>>-- Sample Text	Link file	-1
105	11	4	Fuel Quality Poor.	20	Use recommended fuel.	>>-- Sample Text	Link file	-1
106	11	5	Injection Pump Timing Incorrectly Adjusted.	20	Check top dead center (TDC). Check/adjust injection pump timing. Check/time the fuel injection pump using the spill port timing if equipment is available.	>>-- Sample Text	Link file	-1
107	11	7	Injector Installed with more than one sealing washer.	20	Remove extra washer .	>>-- Sample Text	Link file	-1
108	11	8	Injectors Malfunctioning.	20	Check/replace injectors.	>>-- Sample Text	Link file	-1
109	11	9	Coolant Leaking into Combustion Chamber.	20	Check Expansion plugs.	>>-- Sample Text	Link file	-1
110	11	10	Fuel Injection Pump / Delivery Valves Malfunctioning.	20	Remove fuel injection pump. Have calibration checked.	>>-- Sample Text	Link file	-1
111	12	1	Coolant Level Low.	20	Check/replenish coolant. Locate and correct the source of the coolant leak.	>>-- Sample Text	Link file	-1
112	12	2	Radiator Fins Plugged.	20	Blow debris from fins.	>>-- Sample Text	Link file	-1
113	12	4	Water Pump or Fan Drive Belts Loose.	20	Check/correct belt tension.	>>-- Sample Text	Link file	-1
114	12	5	Radiator Hose Collapsed , Restricted or Leaking.	20	Check/replace hose.	>>-- Sample Text	Link file	-1
115	12	6	Lubricating Oil Level High.	20	Check/drain oil to correct level.	>>-- Sample Text	Link file	-1
116	12	7	Cooling Fan Shroud Damaged or Missing.	20	Inspect shroud, repair/replace or install.	>>-- Sample Text	Link file	-1
117	12	8	Pressure Cap Incorrect or Malfunctioning.	20	Replace cap with the correct rating for the system.	>>-- Sample Text	Link file	-1
118	12	9	Over concentration of Anti-Freeze.	20	Remove part of the coolant from cooling system and replace with water.	>>-- Sample Text	Link file	-1
119	12	10	Temperature Sensor or Gauge Malfunctioning.	20	Verify that the gauge and temperature sensor are accurate.	>>-- Sample Text	Link file	-1
120	12	11	Thermostat Malfunctioning, Incorrect or Missing.	20	Check/replace the thermostat.	>>-- Sample Text	Link file	-1
121	12	12	Air or Combustion Gases in the Cooling System.	20	Make sure the fill rate is not being exceeded and the correct vented thermostat is installed. If aeration continued, check for a compression leak through the head gasket.	>>-- Sample Text	Link file	-1
122	12	13	Water Pump Malfunctioning.	20	Check/replace the water pump.	>>-- Sample Text	Link file	-1
123	12	14	Cooling Passages in Radiator, Head Gasket or Block Plugged.	20	Flush the system and fill with clean coolant.	>>-- Sample Text	Link file	-1
124	12	15	Vehicle Cooling System Design.	20	Confirmation of correct fan, radiator, and other cooling system components.	>>-- Sample Text	Link file	-1
125	12	16	Fuel Injection Pump Timing Incorrect.	20	Verify fuel injection pump timing marks are aligned.	>>-- Sample Text	Link file	-1
126	12	17	Fuel Injection Pump Over fueled.	20	Remove fuel injection pump. Have calibration checked.	>>-- Sample Text	Link file	-1
127	13	1	Coolant Level Low.	20	Add coolant.	>>-- Sample Text	Link file	-1
128	13	2	Temperature Sensor or Gauge Malfunctioning.	20	Verify that the gauge and temperature sensor are accurate.	>>-- Sample Text	Link file	-1
129	13	3	Fan Drive Belt Loose.	20	Check belt tension.	>>-- Sample Text	Link file	-1
130	13	4	Radiator Hose Collapsed, Restricted or Leaking.	20	Inspect hoses.	>>-- Sample Text	Link file	-1
131	12	3	Air Flow to the radiator Inadequate or Restricted	20	Check/repair fan shroud, fan sensors, and fan clutch as required.	>>-- Sample Text	Link file	-1
132	13	5	Cap Rated Pressure Too Low.	20	Check the radiator pressure cap.	>>-- Sample Text	Link file	-1
133	13	6	Thermostat Incorrect or Malfunctioning.	20	Check thermostat.	>>-- Sample Text	Link file	-1
134	13	7	Air or Combustion Gases in the Cooling System.	20	Check for air or combustion gases in the cooling system.	>>-- Sample Text	Link file	-1
135	13	8	Vent Line From Engine Radiator Plugged/Incorrectly Routed.	20	Check routing and operation of vent line.	>>-- Sample Text	Link file	-1
136	13	9	Water Pump Malfunctioning.	20	Check water pump operation. Replace the water pump.	>>-- Sample Text	Link file	-1
137	13	10	Leak Between the Top Tank and the Auxiliary Tank.	20	Check for coolant leakage between radiator auxiliary tank and radiator top tank.	>>-- Sample Text	Link file	-1
138	14	1	Air Flow Across the Radiator Excessive.	20	Check/repair fan clutch, as required.	>>-- Sample Text	Link file	-1
139	14	2	Thermostat Broken, Damaged, Contaminated or Not Sealing.	20	Check/replace Thermostat.	>>-- Sample Text	Link file	-1
140	14	3	Temperature Sensor or Gauge Malfunctioning.	20	Verify that the gauge and sensor are accurate.	>>-- Sample Text	Link file	-1
141	14	4	Coolant Not flowing by Temperature Sensor.	20	Check/clean coolant passages.	>>-- Sample Text	Link file	-1
142	15	1	Overfilling up to top in the radiator.	20	Fill the coolant in the radiator up to correct level.	>>-- Sample Text	Link file	-1
143	15	2	External Engine Oil Leak.	20	Visually inspect the engine and components for seal, gasket, or drain cock leaks.	>>-- Sample Text	Link file	-1
144	15	3	Overheating of Compression Gases Leaking Resulting in Loss.	20	Review the operation for overheating and low power.	>>-- Sample Text	Link file	-1
145	15	4	Lubricating Oil Cooler Leak.	20	Check/replace the oil cooler. Look for coolant in the oil.	>>-- Sample Text	Link file	-1
146	15	5	Cylinder Head Gasket Leak.	20	Check/replace the head gasket.	>>-- Sample Text	Link file	-1
147	15	6	Cylinder Head Cracked or Porous.	20	Check/replace the head.	>>-- Sample Text	Link file	-1
148	15	7	Cylinder Block Coolant Passages Leaking.	20	Check/replace the cylinder block.	>>-- Sample Text	Link file	-1
149	16	1	Lubricating Oil Level Low.	20	Check / replenish lubricating oil. Check for a severe external oil leak that could reduce the pressure.	>>-- Sample Text	Link file	-1
150	16	2	Lubricating Oil Viscosity.Thin,Diluted/Not Meet Specification.	20	Verify the correct oil is being used. Check for oil dilution.	>>-- Sample Text	Link file	-1
151	16	3	Engine Temperature High.	20	Check Thermostat.	>>-- Sample Text	Link file	-1
152	16	4	Pressure Switch or Gauge Malfunctioning.	20	Verify the pressure switch is functioning correctly.	>>-- Sample Text	Link file	-1
153	16	5	Pressure Regulator Valve Stuck Open.	20	Check/replace valve.	>>-- Sample Text	Link file	-1
154	16	6	Lubricating Oil Filter Plugged.	20	Change lubricating oil filter; review change interval.	>>-- Sample Text	Link file	-1
155	16	7	Lubricating Oil Cooler Plugged.	20	Replace lubricating oil cooler.	>>-- Sample Text	Link file	-1
156	28	1	Generally it is caused by lack of air if charging pressur is too low.	20	Clean air filter,replace filter insert.	>>-- Sample Text	Link file	-1
157	16	10	Cylinder Block or Cylinder Head Plugs Loose or Missing.	20	Check / replace expansion plugs.	>>-- Sample Text	Link file	-1
158	16	12	Lubricating Oil Pump Worn.	20	Check/replace lubricating oil pump.	>>-- Sample Text	Link file	-1
159	16	13	Main Bearing Cap Loose.	20	Check/install new bearings and tighten cap.	>>-- Sample Text	Link file	-1
160	16	14	Bearings Worn.	20	Inspect/replace bearings.	>>-- Sample Text	Link file	-1
161	17	1	Pressure Switch or Gauge Malfunctioning.	20	Verify the pressure switch is functioning correctly.	>>-- Sample Text	Link file	-1
162	17	2	Engine Running Too Cold.	20	Check Thermostat.	>>-- Sample Text	Link file	-1
163	17	3	Lubricating Oil Viscosity Too Thick.	20	Make sure the correct lubricating oil is being used.	>>-- Sample Text	Link file	-1
164	17	4	Pressure Regulator Stuck Closed.	20	Check/replace valve.	>>-- Sample Text	Link file	-1
165	18	1	External Leaks.	20	Visually inspect for lubricating oil leaks.	>>-- Sample Text	Link file	-1
166	18	2	Crankcase Being Overfilled (Dipstick Calibrated Incorrectly).	20	Verify that the dipstick is correctly marked.	>>-- Sample Text	Link file	-1
167	18	3	Incorrect Lubricating Oil (Specification or Viscosity).	20	Make sure the correct lubricating oil is being used. Look for reduced viscosity from dilution with fuel. Fuel dilution in lubricating oil can originate from fuel injection pump driveshaft seal or fuel transfer pump. Review/reduce the lubricating oil chang	>>-- Sample Text	Link file	-1
168	18	4	High Blowby forcing Lubricating Oil Out the Breather.	20	Check the breather tube area for sign of lubricating oil loss. Measure the blowby and perform the required repairs.	>>-- Sample Text	Link file	-1
169	18	5	Lubricating Oil Cooler Leak.	20	Check for lubricating oil in the coolant.	>>-- Sample Text	Link file	-1
170	18	6	Air Compressor Pumping Lubricating Oil.	20	Check/replace air compressor.	>>-- Sample Text	Link file	-1
171	18	7	Turbocharger Leaking Lubricating Oil to the Air Intake.	20	Inspect the air crossover tube for evidence of lubricating oil transfer.	>>-- Sample Text	Link file	-1
172	18	8	Valve Seals Worn.	20	Inspect/replace the valve seals.	>>-- Sample Text	Link file	-1
173	18	9	Piston Rings Not Sealing - Lubricating Oil Being Consumed.	20	Perform a compression check. Repair as required.	>>-- Sample Text	Link file	-1
174	19	1	Coolant Rusty,Operation Without Correct Mixture.	20	Drain and flush the cooling system. Fill with correct mixture of antifreeze and water. Review the coolant change interval.	>>-- Sample Text	Link file	-1
175	19	2	Lubricating Oil Leaks from Lubricating Oil Cooler.	20	Check oil cooler gasket/oil cooler.	>>-- Sample Text	Link file	-1
176	20	1	Coolant in the Lubricating Oil, Internal Engine Comp. Leaks.	20	Check & Rectify Leakages.	>>-- Sample Text	Link file	-1
177	20	2	Lubricating Oil Sludge Excessive.	20	Review lubricating oil and filter change intervals. Make sure the correct lubricating oil is being used.	>>-- Sample Text	Link file	-1
178	20	3	Fuel in the Lubricating Oil, Engine Operating Too Cold.	20	Review the operation for excessive idling resulting in the engine running below normal temperature.	>>-- Sample Text	Link file	-1
179	20	7	Injection Needle Valves Not Sealing.	20	Locate and replace malfunctioning injector.	>>-- Sample Text	Link file	-1
180	21	1	Operating for Extended Periods Under Light/no Load Conditions.	20	Review operating procedure with operator.	>>-- Sample Text	Link file	-1
181	21	2	Intake Air Restriction.	20	Review operation for excessive idling. Check/replace filter element.	>>-- Sample Text	Link file	-1
182	21	3	Injector Needle Valve Stuck Open.	20	Locate and replace malfunctioning injector.	>>-- Sample Text	Link file	-1
183	21	4	Turbocharger Lubricating Oil Drain Line Obstructed.	20	Check / clean line.	>>-- Sample Text	Link file	-1
184	21	5	Turbocharger Seals Leaking Oil.	20	Check/replace turbocharger.	>>-- Sample Text	Link file	-1
185	21	6	Blowby Excessive.	20	Check for excessive blowby.	>>-- Sample Text	Link file	-1
186	21	7	Fuel Injection Pump Timing Incorrect.	20	Check/time the injection pump.	>>-- Sample Text	Link file	-1
187	22	2	Air in the Fuel System.	20	Bleed the fuel system.	>>-- Sample Text	Link file	-1
188	22	3	Poor Quality Fuel.	20	Verify by operating from a temporary tank with good fuel; clean and flush the fuel supply tanks.	>>-- Sample Text	Link file	-1
189	22	4	Engine Overloaded.	20	Verify that engine load rating is not being exceeded.	>>-- Sample Text	Link file	-1
190	22	5	Fuel Injection Pump Timing Incorrect.	20	Check/time fuel injection pump.	>>-- Sample Text	Link file	-1
191	22	6	Injectors Malfunctioning.	20	Replace injectors.	>>-- Sample Text	Link file	-1
192	22	7	Coolant Operating Temperature Incorrect.	20	Check Thermostat.	>>-- Sample Text	Link file	-1
193	23	1	Additional Loading from Malfunctioning Accessories.	20	Check/repair accessories and vehicle components.	>>-- Sample Text	Link file	-1
194	23	2	Operator Technique.	20	Review Operation for correct gear shifts, deceleration, and idling.	>>-- Sample Text	Link file	-1
195	23	3	Fuel Leaks.	20	Check for external leaks and engine lubricating oil dilution. For fuel dilution, check for internal leaks at the fuel transfer pump and injection pump.	>>-- Sample Text	Link file	-1
196	23	4	Poor Quality Fuel.	20	Make sure quality No. 2 fuel is being used.	>>-- Sample Text	Link file	-1
197	23	5	Intake Air or Exhaust Restriction.	20	Check the air Filter.	>>-- Sample Text	Link file	-1
198	23	6	Injectors Worn or Malfunctioning.	20	Check/replace injectors.	>>-- Sample Text	Link file	-1
199	23	7	Fuel Injection Pump Timing Incorrect.	20	Check/time the fuel injection pump.	>>-- Sample Text	Link file	-1
200	23	9	Valves Not Seating.	20	Check/adjust valves.	>>-- Sample Text	Link file	-1
201	23	10	Power Functions Malfunctioning.	20	Check/repair power functions.	>>-- Sample Text	Link file	-1
202	24	1	Fuel Shutoff Valve Inoperative.	20	Stop the engine mechanically with lever on the fuel pump. Check for correct solenoid operation.	>>-- Sample Text	Link file	-1
203	24	2	Fuel Injection Pump Malfunctioning.	20	Remove the fuel injection pump and have checked/repaired.	>>-- Sample Text	Link file	-1
204	24	3	Engine Running on Fumes Drawn into the Air Intake.	20	Check the air intake ducts for the source of the fumes.	>>-- Sample Text	Link file	-1
205	25	1	Engine Not Running Smoothly.	20	Adjust valves, check inlet/exhaust restriction.	>>-- Sample Text	Link file	-1
206	25	2	Engine Low Idle Speed Too Low.	20	Adjust engine low idle speed.	>>-- Sample Text	Link file	-1
207	25	3	Fan Damaged or Accessories Malfunctioning.	20	Check/replace the vibrating component.	>>-- Sample Text	Link file	-1
208	25	5	Alternator Bearing Worn or Damaged.	20	Check/replace the alternator.	>>-- Sample Text	Link file	-1
209	25	6	Vibration Damper Malfunctioning.	20	Inspect/replace the vibration damper.	>>-- Sample Text	Link file	-1
210	25	7	Flywheel Housing Misaligned.	20	Check/correct flywheel alignment.	>>-- Sample Text	Link file	-1
211	25	8	Power Component Loose or Broken.	20	Inspect the crankshaft and rods for damage that cause an unbalance.	>>-- Sample Text	Link file	-1
212	25	9	Engine Mounts Loose or Broken.	20	Check/replace engine mounts.	>>-- Sample Text	Link file	-1
213	26	1	Drive Belt Squeal Insufficient Tension.	20	Check the tensioned and inspect the drive belt for deterioration. Make sure water pump, tensioned pulley, fan hub and alternator turn freely. Check for paint/oil or other material on pulleys. Check the tension of accessory drive belt. Make sure the access	>>-- Sample Text	Link file	-1
214	26	2	Intake Air or Exhaust Leaks.	20	Check & rectify Leakage.	>>-- Sample Text	Link file	-1
215	26	3	Valve Lash Excessive.	20	Adjust valves. Make sure the push rods are not bent or the rocker levers are not severely worn.	>>-- Sample Text	Link file	-1
216	26	4	Turbocharger Noise.	20	Check turbocharger impeller and turbine wheel for housing contact.	>>-- Sample Text	Link file	-1
217	26	6	Power Function Knock.	20	Check/replace rod and main bearings.	>>-- Sample Text	Link file	-1
218	27	1	Battery Connections Loose or Corroded.	20	Check/tighten battery connections.	>>-- Sample Text	Link file	-1
219	27	2	Battery Condition.	20	Load test the battery. If battery charge is low, charge the battery and load test again. If the battery fails the load test, replace the battery.	>>-- Sample Text	Link file	-1
220	27	3	Alternator Belt Slipping.	20	Check/replace belt tensioned.	>>-- Sample Text	Link file	-1
221	27	4	Alternator Pulley Loose on Shaft.	20	Repair/tighten pulley.	>>-- Sample Text	Link file	-1
222	28	2	Dirt in tha air filter system,deformation in the suction piping	20	Check suction piping.	>>-- Sample Text	Link file	-1
223	28	3	Silencers or exhaust gas piping behind the charger containminated or damaged.	20	Clean or repair silencer/exhaust gas pipes.	>>-- Sample Text	Link file	-1
224	29	1	Leakages at joints and flanges of air and exhaust gas pipes.	20	Cjeck joints and flanges connections possibly replace gaskets.	>>-- Sample Text	Link file	-1
225	29	2	Grazing of rotars	20	Remove piping, check turbines and compressor side housing for traces of grazing;l possibly check bearing clearances.	>>-- Sample Text	Link file	-1
226	13	11	Radiator Cap Incorrect or Malfunctioning.	20	Check the radiator pressure cap.	>>-- Sample Text	Link file	-1
227	19	3	Lubricating Oil Leaks from Head and Cylinder Block.	20	Check Gasket.	>>-- Sample Text	Link file	-1
228	30	1	Improper lubrication of turbocharger	20	Replace charger. To avoid more damages until the charger can be replaced, do not drive vehicle with load: observe for black smoke.	>>-- Sample Text	Link file	-1
229	32	1	Insufficient residual voltage	20	Excite the rotor using battery	>>-- Sample Text	Link file	-1
230	32	2	Improper connection	20	Correct the connection	>>-- Sample Text	Link file	-1
231	32	3	faulty moulded rectifire bridge	20	Replace the rectifier bridge	>>-- Sample Text	Link file	-1
232	32	4	Low speed	20	Reset the speed to the nominal	>>-- Sample Text	Link file	-1
233	32	5	Faulty winding	20	Check the winding resistance and rewind if required	>>-- Sample Text	Link file	-1
234	32	6	Rotating rectifier failure	20	Replace the rotating rectifire	>>-- Sample Text	Link file	-1
235	32	7	faulty AVR	20	Replace the AVR	>>-- Sample Text	Link file	-1
236	33		Air-gap of compound too small	20	Regulate the compound air-gap	>>-- Sample Text	Link file	-1
237	33		Faulty rotating rectifier	20	Replace the rotating rectifire	>>-- Sample Text	Link file	-1
238	33		Faulty winding	20	Check the winding resistance and rewind if required	>>-- Sample Text	Link file	-1
239	33		faulty moulded rectifire bridge	20	Replace the rectifier bridge	>>-- Sample Text	Link file	-1
240	34		Compound defective	20	Check and if necessary change the compound unit	>>-- Sample Text	Link file	-1
241	34		Faulty rotor winding	20	Check the rotor winding resistance and if faulty rewind it	>>-- Sample Text	Link file	-1
242	34		over load on alternator	20	Operate on specified load	>>-- Sample Text	Link file	-1
243	35		Capacitors on the load side	20	Disconnect the PF improvement capacitors	>>-- Sample Text	Link file	-1
244	35		Incorrect compound assembly	20	Check the compound winding resisitance & if necessary replace it	>>-- Sample Text	Link file	-1
245	36		Excessive speed	20	Adjust the revolving speed	>>-- Sample Text	Link file	-1
246	36		Air-gap compound too high	20	Reduce the compound Air - gap	>>-- Sample Text	Link file	-1
247	37		Incorrect AVR setting	20	Set AVR stability port	>>-- Sample Text	Link file	-1
248	37		thyristor load more than specified limits	20	Reduce the Thyristor load	>>-- Sample Text	Link file	-1
249	37		unsufficient engine flywheel	20	Check for right fly whee	>>-- Sample Text	Link file	-1
250	38		Unbalance load	20	Correct the load	>>-- Sample Text	Link file	-1
251	38		Loose connections	20	Tighten the loose connections	>>-- Sample Text	Link file	-1
252	38		Stator winding faulty	20	check winding resistance & rewind if required	>>-- Sample Text	Link file	-1
253	39		Set Misalignment	20	Align the set properly	>>-- Sample Text	Link file	-1
254	39		Bearing loose in end shield housing	20	replace the faulty end shield	>>-- Sample Text	Link file	-1
255	40		Air Flow (inlet - outlet) partially clogged or hot air is being circulated either from alternator or prime mover	20	Check air inlet - outlet of the alternator	>>-- Sample Text	Link file	-1
256	40		Alternator operating at high voltage at load	20	Set the voltage to rated value	>>-- Sample Text	Link file	-1
257	40		Alternator overloaded	20	Operate at specified load	>>-- Sample Text	Link file	-1
258	40		Load PF less than 0.8 lag	20	Correct the load power factor	>>-- Sample Text	Link file	-1
259	41		Defective mounting or play in the coupling	20	Replace the coupling & check the alignment reset the speed to the nominal	>>-- Sample Text	Link file	-1
260	41		Three phase alternator is single phase loaded in excess of acceptable limits	20	Check and correct the load	>>-- Sample Text	Link file	-1
261	41		Start up with no - load : if humming persists -faulty alternator stator winding	20	rewind ststor	>>-- Sample Text	Link file	-1
262	42		Short circuit in the external circuit (including wiring between alternator and control board) object fallen into the machine short circuit or flash in the stator winding	20	Stop the set immediately	>>-- Sample Text	Link file	-1
263	43		Short circuit external circuit	20	Stop the genset immediately	>>-- Sample Text	Link file	-1
264	43		Faulty parallel connection (out of phase)	20		>>-- Sample Text	Link file	-1
265	43		Break or deterioration in the cupling	20		>>-- Sample Text	Link file	-1
266	43		Break or twist in shaft extension	20		>>-- Sample Text	Link file	-1
267	43		shifting or short circuit of main field winding	20		>>-- Sample Text	Link file	-1
268	43		bursting or unlocking of the fan	20		>>-- Sample Text	Link file	-1
269	43		Diode burnt , rectifier bridge damaged	20		>>-- Sample Text	Link file	-1`;

export async function seedTroubleshooting() {
    console.log('Seeding Troubleshooting Data...');

    // 1. Products
    for (const p of products) {
        await prisma.troubleshootingProduct.upsert({
            where: { name: p.name },
            update: { viewSeq: p.viewSeq, userView: p.userView, id: p.id },
            create: {
                id: p.id,
                name: p.name,
                viewSeq: p.viewSeq,
                userView: p.userView
            },
        });
    }
    console.log(`- Upserted ${products.length} products.`);

    // Mapping: OriginalFaultID -> Actual ProductFault ID (UUID)
    const faultIdMap = new Map<number, string>();

    // 2. Faults (Library) & Bridges
    for (const f of faults) {
        // A. Ensure Fault exists in Library
        const faultLib = await prisma.faultLibrary.upsert({
            where: { name: f.name },
            update: {},
            create: { name: f.name },
        });

        // B. Link to Product
        const pf = await prisma.productFault.upsert({
            where: {
                productId_faultId: {
                    productId: f.prodId,
                    faultId: faultLib.id
                }
            },
            update: { viewSeq: f.seq },
            create: {
                productId: f.prodId,
                faultId: faultLib.id,
                viewSeq: f.seq
            },
        });

        // Store mapping for Causes linking
        faultIdMap.set(f.id, pf.id);
    }
    console.log(`- Processed ${faults.length} fault entries.`);

    // 3. Causes
    const parsed = Papa.parse(causesCSV, { delimiter: '\t', header: false, skipEmptyLines: true });

    let causeCount = 0;
    for (const row of parsed.data as string[]) {
        // Columns: 0:ID, 1:FaultID, 2:Seq, 3:Possible Causes, 4:Divert, 5:Action, 6:Symptoms, 7:Ref, 8:UserView
        const faultIdOriginal = parseInt(row[1]);
        const seq = parseInt(row[2]) || 0;
        const name = row[3]?.trim();
        const action = row[5]?.trim();
        const symptoms = row[6]?.trim();
        const ref = row[7]?.trim();

        if (!name) continue;

        // Find linked ProductFault
        const productFaultId = faultIdMap.get(faultIdOriginal);
        if (!productFaultId) {
            console.warn(`WARNING: Skipping Cause "${name}" - Original Fault ID ${faultIdOriginal} not found in seeded faults.`);
            continue;
        }

        // A. Ensure Cause exists in Library (Unique by Name)
        // Note: Some causes might have same name but different action? 
        // Data analysis shows many duplicates. We'll upsert by Name.
        const causeLib = await prisma.causeLibrary.upsert({
            where: { name: name },
            update: {
                action: action,
                symptoms: symptoms,
                manualRef: ref
            },
            create: {
                name: name,
                action: action,
                symptoms: symptoms,
                manualRef: ref
            },
        });

        // B. Link to ProductFault (The specific Diagnostic Path)
        await prisma.faultCause.upsert({
            where: {
                productFaultId_causeId: {
                    productFaultId: productFaultId,
                    causeId: causeLib.id
                }
            },
            update: { seq: seq },
            create: {
                productFaultId: productFaultId,
                causeId: causeLib.id,
                seq: seq
            },
        });

        causeCount++;
    }
    console.log(`- Processed ${causeCount} cause entries.`);
}

// Allow running directly
if (require.main === module) {
    seedTroubleshooting()
        .then(async () => {
            await prisma.$disconnect()
        })
        .catch(async (e) => {
            console.error(e)
            await prisma.$disconnect()
            process.exit(1)
        })
}
