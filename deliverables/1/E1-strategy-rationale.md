# Detection-Response Strategy and Rationale

## Strategy
My strategy was to develop a detailed and working end to end proof of concept that showcases the example use cases, with additional use cases to demonstrate my ability to think about and establish potent use cases independently. 

For example, the use case of detecting a potential private key compromise with a pause response. The following use case of preventing interest payments to an OFAC sanctioned address is also powerful. The idea is to showcase my ability to develop use cases related to compliance and security. The rationale behind the use cases is straightforward: they represent scenarios that a financial institution would find particularly valuable. 

Admittedly, I focused more on developing a fully working end to end solution more than the slides. I chose this approach because I'm more comfortable presenting solutions I have a solid technical understanding of, and the best way for me to do that is by working directly with the code. In hindsight, I probably should have taken a more balanced approach, focusing equally on the slides. However, I believe the end result is a solid proof of concept that demonstrates my technical skills and understanding of the requirements.  

## Monitoring Scenarios and Rationale

### 1. Missed Interest Payments Detection

**Monitor**: Time-based check on 1st of month at 10 AM for InterestPaid event
**Relayer**: Alert operations team via email/SMS

**Rationale**: Bond interest payments are contractual obligations with strict SLA requirements. Failed payments damage investor confidence and can trigger default clauses. Automated detection ensures issues are caught quickly.

### 2. Large Transfer Detection

**Monitor**: LargeTransfer event for amounts >$10M
**Relayer**: Emergency pause contract to prevent additional transfers

**Rationale**: Large transfers could represent immediate financial risk. Immediate notification and the ability to automatically pause the contract or a specific function contains damage to a single transaction rather than systematic drain. Optional Automatic SAR filing ensures regulatory compliance within required timeframes.

### 3. Regulatory Threshold Monitoring

**Monitor**: Concentration Risk event when entity ownership exceeds 20%
**Relayer**: Alert compliance team and block further purchases

**Rationale**: SEC regulations limit single-entity ownership of certain securities to 20%. Violations result in significant penalties and forced divestiture. Real-time monitoring prevents violations before they occur, rather than discovering them during quarterly audits. Automatic purchase blocking ensures compliance without manual intervention. 

### 4. Private Key Compromise Detection

**Monitor**: Upgraded event outside approved maintenance windows
**Relayer**: Emergency pause and alert security team

**Rationale**: Contract upgrades are high-risk operations typically restricted to maintenance windows. Upgrades outside these windows indicate potential key compromise or insider threat. Immediate pausing prevents malicious contract changes from taking effect. Financial institutions require change control processes - this automates enforcement.

### 5. OFAC Sanctions Screening

**Monitor**: distributeInterest() function calls
**Relayer**: Screen recipients against OFAC list, block sanctioned addresses

**Rationale**: Financial institutions face severe penalties for transactions with sanctioned entities. OFAC lists update daily, making manual screening error-prone. Pre-transaction screening prevents violations rather than attempting remediation after funds are sent. 

### 6. Roles Update Monitoring
**Monitor**: RoleUpdated event for critical roles (e.g., Pauser, Upgrader)
**Relayer**: Alert operations team and block further role changes

**Rationale**: Changes to critical roles can indicate insider threats or governance issues. Immediate notification allows for investigation before further changes occur. Blocking further changes prevents escalation of potential issues.

