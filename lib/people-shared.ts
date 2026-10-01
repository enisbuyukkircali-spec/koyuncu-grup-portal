export const peoplePermissions=['training.view_own','training.manage','onboarding.manage','offboarding.manage','offboarding.override','departures.manage','people_tasks.view_own','people_tasks.update_own'];
export type Choice={id:string;name:string};
export type Checklist={id:string;user_id:string;employee:string;kind:string;title:string;status:string;completed_at:string|null;active_assets:number};
export type PeopleTask={id:string;title:string;assignee_id:string|null;department_id:string|null;deadline:string|null;status:string;completed_at:string|null;assignee_name:string;department_name:string};
export type Course={id:string;title:string;category:string;description:string;active:boolean};
export type TrainingAssignment={id:string;title:string;employee:string;user_id:string;course_id:string;due_date:string;status:string;completed_at:string|null;valid_until:string|null;has_certificate:boolean};
