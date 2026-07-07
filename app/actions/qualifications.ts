'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createQualification(data: any) {
  try {
    await db.qualifications.create({
      data: {
        empID: data.empID,
        programId: data.programId,
        testDate: data.testDate ? new Date(data.testDate) : null,
        maxMarks: data.maxMarks ? parseInt(data.maxMarks) : null,
        obtainedMarks: data.obtainedMarks ? parseInt(data.obtainedMarks) : null,
        Qualified: data.Qualified,
        facilitator: data.facilitator,
        securedTest: data.securedTest,
      },
    });
    revalidatePath('/admin/tests-qualifications');
    return { success: true };
  } catch (error) {
    console.error('Error creating qualification:', error);
    return { success: false, error: 'Failed to create qualification' };
  }
}

export async function deleteQualification(id: number) {
  try {
    await db.qualifications.delete({
      where: { id },
    });
    revalidatePath('/admin/tests-qualifications');
    return { success: true };
  } catch (error) {
    console.error('Error deleting qualification:', error);
    return { success: false, error: 'Failed to delete qualification' };
  }
}

export async function bulkUploadQualifications(data: any[]) {
  try {
    const formattedData = data.map((item) => ({
      empID: item.empID,
      programId: item.programId,
      testDate: item.testDate ? new Date(item.testDate) : null,
      maxMarks: item.maxMarks ? parseInt(item.maxMarks) : null,
      obtainedMarks: item.obtainedMarks ? parseInt(item.obtainedMarks) : null,
      Qualified: item.Qualified === 'true' || item.Qualified === true,
      facilitator: item.facilitator,
      securedTest: item.securedTest === 'true' || item.securedTest === true,
    }));

    await db.qualifications.createMany({
      data: formattedData,
    });
    
    revalidatePath('/admin/tests-qualifications');
    return { success: true };
  } catch (error) {
    console.error('Error in bulk upload:', error);
    return { success: false, error: 'Failed to bulk upload' };
  }
}
