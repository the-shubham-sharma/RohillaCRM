package com.rohilla.crm.project.enums;

import com.rohilla.crm.project.entity.Project;

public enum ProjectStatus {
    DRAFT,
    MANAGER_REVIEW,
    DESIGN_TECHNICAL_CHECK,      // Path A: Designer machine/production compatibility check
    DESIGN_IN_PROGRESS,          // Path B: Designer creating new artwork
    DESIGN_SUBMITTED,            // Path B: Designer submitted artwork
    CUSTOMER_APPROVAL_PENDING,   // Path B: Awaiting customer approval
    CUSTOMER_APPROVED,           // Path B: Customer approved design
    CUSTOMER_REWORK_REQUESTED,   // Path B: Customer requested design changes
    MANAGER_APPROVED,            // Path B: Manager approved design for production
    READY_FOR_PRODUCTION,        // Eligible for production
    IN_PRODUCTION,               // Production / printing in progress
    PRODUCTION_COMPLETED,        // Production work done, ready for QC
    QC_PENDING,                  // Quality inspection in progress
    QC_PASSED,                   // Passed QC
    QC_REJECTED,                 // Failed QC (needs rework in production)
    DISPATCH_PENDING,            // Ready for dispatch
    DISPATCHED,                  // Dispatched via courier / vehicle
    INSTALLATION_PENDING,        // On-site installation in progress
    INSTALLATION_COMPLETED,      // On-site installation finished
    COMPLETED,                   // Fully completed
    CANCELLED                    // Cancelled
}
