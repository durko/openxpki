Configuration of the SCEP Workflow
====================================

Before you can use the SCEP subsystem, you need to enable the SCEP Server in the general configuration. This section explains the options for the scep enrollment workflow.

The workflow fetches all information from the configuration system at ``scep.<servername>`` where the servername is the name written in the configuration of your scep cgi script.

Here is a complete sample configuration::
    
    scep-server-1:

        token: my-special-scep
        renewal_period: 000014

        replace_period: 05
        revoke_on_replace:
            reason_code: keyCompromise
            invalidity_time: +000014
    
        workflow_type: I18N_OPENXPKI_WF_TYPE_ENROLLMENT

        key_size:
            rsaEncryption: 1020-2048

        hash_type: 
        - sha1
   
        authorized_signer_on_behalf:
            technicans:
                subject: CN=.*DC=SCEP Signer CA,DC=mycompany,DC=com
                profile: I18N_OPENXPKI_PROFILE_SCEP_SIGNER
            super-admin:                
                identifier: JNHN5Hnje34HcltluuzooKVqxss                                    
        
        response:
            getcacert_strip_root: 0          

        policy:         
            allow_anon_enroll: 0
            allow_man_approv: 1
            allow_man_authen: 1            
            max_active_certs: 1
            allow_expired_signer: 0
            auto_revoke_existing_certs: 0
            approval_points: 1
  

        # Mapping of names to OpenXPKI profiles to be used with the
        # Microsoft Certificate Template Name Ext. (1.3.6.1.4.1.311.20.2)              
        profile_map:
            tlsv2: I18N_OPENXPKI_PROFILE_TLS_SERVER_v2

	subject_style: enroll

        challenge:
            value: SecretChallenge

        eligible:
            initial:
                value: 1

            renewal:
                value: 1
                        
        response:
	    getcacert_strip_root: 0

*All time period value are interpreted as OpenXPKI::DateTime relative date but given without sign.*

Configuration Items
-------------------

**token**

This key is optional, if not given the name of the token group to use is looked up from the
type map under `crypto.type.scep` and all scep servers will share the same token.
You can give the name of a token group alias, which needs to be registered as an anonymous 
alias::

    openxpkiadm alias --realm ca-one --identifier <identifier> --group my-special-scep --gen 1

Note that you need to care yourself about the generation index. The token will then be listed as anonymous group item::

    openxpkiadm alias --realm ca-one

    === anonymous groups ===
    ca-one-special-scep:
      Alias     : ca-one-special-scep-1
      Identifier: O9vtjge0wHpYhDpfko2O6xYtCWw
      NotBefore : 2014-03-25 15:26:18
      NotAfter  : 2015-03-25 15:26:18

**renewal_period**

How long before the expiry of the current certificate a client can request a renewal. Requests 
made earlier are rejected. If you need to renew a certificate prior this time, you need to use 
initial enrollment.

**replace_period**

Replace is like renewal but with two differences. You get a new certificate for a new key but
it will have the validity of the old one. This can be useful if you need to migrate to a new
profile or replace keys for a large amount of certificates and do not want them to get all the 
same validity (we used that to replace keys after the Heartbleed bug).

**revoke_on_replace**

This parameter is the second difference between renew and replace. The reason_code needs to be
one of the openssl revocation codes (mind the CamelCasing), the invalidity_time can be relative
or absolute date as consumed by OpenXPKI::DateTime, any empty value becomes "now". If you set a 
date in the future, the revocation is triggered but hold back and will appear first on the next 
crl update after the given date. E.g. if you want to give your admins a 48h window to replace 
the certificates before they show up on the CRL, use ::

    revoke_on_replace:
        reason_code: superseded
        invalidity_time: +000002

It also works the other way round - assume you know the security breach happend on the seventh of
april and you want to tell this to the people::   

    revoke_on_replace:
        reason_code: keyCompromise
        invalidity_time: 20140407


**grace_period**

*Code needs to be redone - not implemented*
This is the life-saver for sloppy admins - it allows signing of renewal requests for a certain period 
after the certificate expired. Note: Due to the way this is implemented set this just to a few days 
and never to be larger than ``cert lifetime - renewal period`` as the code will do funny things otherwise!
If you want to allow renewals for an infinite period of time, set the ``allow_expired_signer`` policy flag instead. 

**workflow_type**

The name of the workflow that is used by this server instance.

**key_size**

A hash item list for allowed key sizes and algorithms. The name of the option must be
the key algorithm as given by openssl, the required byte count is given as a range in
bytes. There must not be any space between the dash and the numbers. Hint: Some 
implementations do not set the highest bit to 1 which will result in a nominal key 
size which is one bit smaller than the requested one. So stating a small offset here
will reduce the propability to reject such a key.

**hash_type**
List (or single scalar) of accepted hash algorithms used to sign the request.
  
**authorized_signer_on_behalf**

This section is used to authorize certificates to do a "request on behalf". The list is 
given as a hash of hashes, were each entry is a combination of one or more matching rules. 

Possible rules are subject, profile and identifier which can be used in any combination.
The subject is evaluated as a regexp against the signer subject, therefore any characters with
a special meaning in perl regexp need to be escaped! Identifier and profile are matched as is. 
The rules in one entry are ANDed together. If you want to provide alternatives, add multiple 
list items. The name of the rule is just used for logging purpose.
 
**response.getcacert_strip_root**

The scep standard is a bit unclear if the root should be in the chain or not. 
We consider it a security risk (trust should be always set by hand) but as most clients seem to expect it, we include the root by default. If you are sure your clients do not need the root and have it
deployed, set this flag to 1 to strip the root certificate from the getcacert response.

Policy Flags
-------------

Those flags are imported from the config system into the workflow. The ``p_``-prefix is added on import.

**p_allow_anon_enroll**

Accept anonymous initial enrollments.

**p_allow_man_approv**

Allow a manual approval of request that failed auto-approval.

**p_allow_man_authen**

Stage unauthorized requests for manual authentication (otherwise they are instantly rejected)

**p_max_active_certs**

Maximum number of certs with the same subject that are allowed.

**p_allow_expired_signer**

Accept requests were the signer certificate has expired. This setting is NOT affected by the 
grace_period setting and allows certificates to be used for renewal requests for infinity!  

**p_auto_revoke_existing_certs**

Schedule revocation of all existing certs of the requestor.

**p_approval_points**

Approval of a request is done based on "approval points". One point is assigned
for a positve "eligible" check, each manual approval vie the UI counts as one 
additional point. You can set this to "0" to approve any authorized request.
Note/TODO: The eligible check is currently not implemented and always true.

Subject Rendering
-----------------

By default the received csr is used to create the certificate "as is". To have
some sort of control about the issued certificates, you can use the subject 
rendering engine which is also used with the frontend by setting a profile
style to be used:

    subject_style: enroll

The subject will be created using Template Toolkit with the parsed subject hash
as input vars. The vars hash will use the name of the attribute as key and pass
all values as array in order of appearance (it is always an array, even if the
atrribute is found only once!). You can also add SAN items but there is no way 
to filter or  remove san items that are passed with the request, yet.

Certificate Template Name Extension
---------------------------------------------

This feature was originally introduced by Microsoft and uses a 
Microsoft specific OID (1.3.6.1.4.1.311.20.2). Setting this value
allows a dynamic selection of the used certificate profile. 
You need to define a map with the strings used in the OID and the
OpenXPKI internal profile name.

    profile_map:
        tlsv2: I18N_OPENXPKI_PROFILE_TLS_SERVER_v2                         

If the OID is empty or its value is
not found in the map, the default profile given in the scep server
configuration is used. 

Challenge Validation
--------------------

The sample config above defines a static challenge password. For a dynamic
check, you can use a connector here::

    challenge:
       mode: bind
       value@: connector:scep.connectors.challenge
       args:
       - "[% context.cert_subject %]"

    connectors:
        challenge:
            class: Connector::Builtin::Authentication::Password
            LOCATION: /home/pkiadm/ca-one/passwd.txt

This will use the cert_subject to validate the given password against a list
of given passwords. For config details, check the perldoc of
OpenXPKI::Server::Workflow::Activity::SCEPv2::EvaluateChallenge 

Eligibility Check
-----------------

You can add a datasource to check if a device/request is allowed to perform
an enrollment or renewal request. The default config is always true, resulting
in an immediate approval of requests having valid authentication (challenge or
trusted signer).

Here is a sample config to check weather a device exisits in an ldap repository::

    eligible:
        initial:
            value@: connector:your.connector 
            args: 
            - "[% context.cert_subject %]" 
            - "[% context.url_mac %]"

    connectors:
        devices:
            ## This connector just checks if the given mac
            ## exisits in the ldap
            class: Connector::Proxy::Net::LDAP::Simple
            LOCATION: ldap://localhost:389
            base: ou=devices,dc=mycompany,dc=com
            filter: (macaddress=[% ARGS.1 %])
            binddn: cn=admin,dc=mycompany,dc=com
            password: admin
            attrs: macaddress
    
To have the mac in the workflow, you need to pass it with the request as an url
parameter to the wrapper: `http://host/scep/scep?mac=001122334455`. 
    
For more options and samples, see the perldoc of 
OpenXPKI::Server::Workflow::Activity::SCEPv2::EvaluateEligibility


Status Flags used in the workflow
----------------------------------

The workflow uses status flags in the context to take decissions. Flags are boolean if not stated otherwise.

**csr_key_size_ok**

Weather the keysize of the csr matches the given array. If the key_size definition is missing, the flag is not set.

**have_all_approvals**

Result of the approval check done in CalcApproval.

**in_renew_window**

The request is within the configured renewal period.

**num_manual_authen**

The number of given manual authentications. Can override missing authentication on initial enrollment.

**scep_uniq_id_ok**

The internal request id is really unique across the whole system. 

**signer_is_self_signed**

The signer and the csr have the same public key. Note: If you allow key renewal this might also be a renewal!
  
**signer_on_behalf**

The signer certificate is recognized as an authorized signer on behalf. See *authorized_signer_on_behalf* in the configuration section.  

**signer_signature_valid**

The signature on the PKCS#7 container is valid. 

**signer_sn_matches_csr**

The request subject matches the signer subject. This can be either a self-signed initial enrollment or a renewal!

**signer_status_revoked**

The signer certificate is marked revoked in the database.

**signer_trusted**

The PKI can build the complete chain from the signer certificate to a trusted root. It might be revoked or expired!

**signer_validity_ok**
  
The notbefore/notafter dates were valid at the time of validation. In case you have a grace_period set, a certificate is also valid if it has expired within the grace period.   
  
**valid_chall_pass**

The provided challenge password has been approved.

**valid_kerb_authen**

Request was authenticated using kerberos (not implemented yet) 

Workflow entries used
----------------------

**csr_profile_oid**

The profile name as extracted from the Certificate Type Extension (Microsoft specific)  

