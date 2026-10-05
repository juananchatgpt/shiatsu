export type DocumentStatus='pending'|'valid'|'rejected'
export interface MembershipDocument {id:string;membership_id:string;kind:string;original_name:string;mime_type:string;size_bytes:number;status:DocumentStatus;created_at:string}
export const documentKindLabels:Record<string,string>={professional_qualification:'Titulación profesional',school_program:'Programa formativo',school_teachers:'Equipo docente',school_direction:'Experiencia de dirección',registration_document:'Documentación del alta',other:'Otro documento'}
