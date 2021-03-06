import { SecurityMetadata, AccessDecisionVoter, ACCESS_DENIED, ACCESS_GRANTED,
    POLICY_BASED_VOTER_PRIORITY, PolicyResolver, PrincipalPolicyProvider, ResourcePolicyProvider } from './access-protocol';
import { Component, Autowired } from '@malagu/core';

@Component(AccessDecisionVoter)
export class PolicyBasedVoter implements AccessDecisionVoter {

    readonly priority = POLICY_BASED_VOTER_PRIORITY;

    @Autowired(PolicyResolver)
    protected readonly policyResolvers: PolicyResolver[];

    @Autowired(ResourcePolicyProvider)
    protected readonly resourcePolicyProvider: ResourcePolicyProvider;

    @Autowired(PrincipalPolicyProvider)
    protected readonly principalPolicyProvider: PrincipalPolicyProvider;

    async vote(securityMetadata: SecurityMetadata): Promise<number> {

        const principalPolicies = await this.principalPolicyProvider.provide(securityMetadata.principal, securityMetadata.authorizeType);
        const resourcePolicies = await this.resourcePolicyProvider.provide(securityMetadata.resource, securityMetadata.authorizeType);
        const policies = [ ...principalPolicies, ...resourcePolicies, ...securityMetadata.policies ];
        for (const policy of policies) {
            for (const policyResolver of this.policyResolvers) {
                if (await policyResolver.support(policy)) {
                    if (await policyResolver.resolve(policy, securityMetadata)) {
                        securityMetadata.grant++;
                    } else {
                        return ACCESS_DENIED;
                    }
                }
            }
        }
        if (securityMetadata.grant > 0) {
            return ACCESS_GRANTED;
        }
        return ACCESS_DENIED;
    }

    async support(securityMetadata: SecurityMetadata): Promise<boolean> {
        return true;
    }

}
