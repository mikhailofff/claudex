export type ApiFieldKey = 'github_personal_access_token' | 'e2b_api_key' | 'modal_api_key';

export interface HelperTextLink {
  prefix: string;
  anchorText: string;
  href: string;
}

export interface HelperTextCode {
  prefix: string;
  code: string;
  suffix: string;
}

export interface GeneralSecretFieldConfig {
  key: ApiFieldKey;
  label: string;
  description: string;
  placeholder: string;
  helperText?: HelperTextLink | HelperTextCode;
}
