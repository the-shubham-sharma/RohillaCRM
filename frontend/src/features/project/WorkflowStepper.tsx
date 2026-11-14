import React from 'react';
import { ProjectStatus } from '../../shared/types';

interface WorkflowStepperProps {
  currentStatus: ProjectStatus;
  customerProvidedDesign: boolean;
}

interface StepInfo {
  label: string;
  sublabel: string;
  statuses: ProjectStatus[];
}

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ currentStatus, customerProvidedDesign }) => {
  // Path A Steps (Customer Provided Design)
  const pathASteps: StepInfo[] = [
    {
      label: '1. Manager Review',
      sublabel: 'Customer Design Check',
      statuses: ['DRAFT', 'MANAGER_REVIEW']
    },
    {
      label: '2. Technical Check',
      sublabel: 'Designer Machine Check',
      statuses: ['DESIGN_TECHNICAL_CHECK']
    },
    {
      label: '3. Production',
      sublabel: 'Print & Fabrication',
      statuses: ['READY_FOR_PRODUCTION', 'IN_PRODUCTION', 'PRODUCTION_COMPLETED']
    },
    {
      label: '4. Quality Control',
      sublabel: 'QA Inspection',
      statuses: ['QC_PENDING', 'QC_REJECTED']
    },
    {
      label: '5. Dispatch',
      sublabel: 'Courier & Delivery',
      statuses: ['QC_PASSED', 'DISPATCH_PENDING']
    },
    {
      label: '6. Installation & Done',
      sublabel: 'On-site Fitting / Close',
      statuses: ['DISPATCHED', 'INSTALLATION_PENDING', 'INSTALLATION_COMPLETED', 'COMPLETED']
    }
  ];

  // Path B Steps (Design Required)
  const pathBSteps: StepInfo[] = [
    {
      label: '1. Requirements',
      sublabel: 'Manager Intake',
      statuses: ['DRAFT', 'MANAGER_REVIEW']
    },
    {
      label: '2. Design Creation',
      sublabel: 'Designer Artwork V1/V2',
      statuses: ['DESIGN_IN_PROGRESS']
    },
    {
      label: '3. Customer Approval',
      sublabel: 'Client Proof Sign-off',
      statuses: ['DESIGN_SUBMITTED', 'CUSTOMER_APPROVAL_PENDING', 'CUSTOMER_REWORK_REQUESTED']
    },
    {
      label: '4. Manager Approval',
      sublabel: 'Lock Version for Print',
      statuses: ['CUSTOMER_APPROVED', 'MANAGER_APPROVED']
    },
    {
      label: '5. Production',
      sublabel: 'Print & Fabrication',
      statuses: ['READY_FOR_PRODUCTION', 'IN_PRODUCTION', 'PRODUCTION_COMPLETED']
    },
    {
      label: '6. Quality Control',
      sublabel: 'QA Inspection',
      statuses: ['QC_PENDING', 'QC_REJECTED']
    },
    {
      label: '7. Dispatch',
      sublabel: 'Courier & Delivery',
      statuses: ['QC_PASSED', 'DISPATCH_PENDING']
    },
    {
      label: '8. Installation & Done',
      sublabel: 'On-site Fitting / Close',
      statuses: ['DISPATCHED', 'INSTALLATION_PENDING', 'INSTALLATION_COMPLETED', 'COMPLETED']
    }
  ];

  const steps = customerProvidedDesign ? pathASteps : pathBSteps;

  const getStepIndex = (status: ProjectStatus): number => {
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].statuses.includes(status)) {
        return i;
      }
    }
    return 0;
  };

  const currentStepIndex = getStepIndex(currentStatus);

  return (
    <div style={{ padding: '0.75rem 0 1.25rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '3px',
            fontWeight: 700,
            background: '#FFFFFF',
            color: '#000000',
            border: '1px solid #000000',
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}>
            {customerProvidedDesign ? 'PATH A: Customer Provided Design' : 'PATH B: Design Required'}
          </span>
          <span style={{ fontSize: '12px', color: '#666666' }}>
            {customerProvidedDesign
              ? 'Designer checks machine compatibility → Production → QC → Dispatch → Installation'
              : 'Designer creates artwork → Customer Approval → Manager Approval (Lock) → Production → QC → Dispatch'}
          </span>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        position: 'relative',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem'
      }}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex || currentStatus === 'COMPLETED';
          const isCurrent = index === currentStepIndex && currentStatus !== 'COMPLETED';

          let stepIcon = index + 1;
          let stepBg = '#FFFFFF';
          let stepColor = '#888888';
          let stepBorder = '1px solid #E5E5E5';

          if (isCompleted) {
            stepIcon = (index + 1) as any;
            stepBg = '#000000';
            stepColor = '#FFFFFF';
            stepBorder = '1px solid #000000';
          } else if (isCurrent) {
            stepIcon = (index + 1) as any;
            stepBg = '#FFFFFF';
            stepColor = '#000000';
            stepBorder = '2px solid #000000';
          }

          return (
            <div
              key={step.label}
              style={{
                flex: 1,
                minWidth: '125px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: stepBg,
                  color: stepColor,
                  border: stepBorder,
                  marginBottom: '0.45rem',
                }}
              >
                {stepIcon}
              </div>

              <div style={{ fontSize: '12px', fontWeight: isCurrent ? 700 : isCompleted ? 600 : 500, color: isCurrent || isCompleted ? '#000000' : '#888888' }}>
                {step.label}
              </div>
              <div style={{ fontSize: '11px', color: '#666666', marginTop: '2px' }}>
                {step.sublabel}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
