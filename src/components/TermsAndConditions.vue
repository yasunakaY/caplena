<template>
  <div>
    <h1>Terms and conditions</h1>
    <p>Welcome to caplena.com. If you continue to browse and use this website, you are agreeing to comply with and be bound by the following terms and conditions of use, which together with our privacy policy govern caplena.com's relationship with you in relation to this website. If you disagree with any part of these terms and conditions, please do not use our website.</p>

    <p>Last updated: <em>February 15, 2019</em></p>

    <p>Caplena GmbH ("us", "we", or "our") operates the <a href="https://caplena.com">https://caplena.com</a> website (the "Service").</p>

    <h2>Content</h2>
    <p>The content of the pages of this website is for your general information and use only. It is subject to change without notice.</p>

    <h2>Warranty</h2>
    <p>Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness or suitability of the information and materials found or offered on this website for any particular purpose. You acknowledge that such information and materials may contain inaccuracies or errors and we expressly exclude liability for any such inaccuracies or errors to the fullest extent permitted by law.</p>
    <p>Your use of any information or materials on this website is entirely at your own risk, for which we shall not be liable. It shall be your own responsibility to ensure that any products, services or information available through this website meet your specific requirements.</p>

    <h2>Copyright</h2>
    <p>This website contains material which is owned by or licensed to us. This material includes, but is not limited to, the design, layout, look, appearance and graphics. Reproduction is prohibited other than in accordance with the copyright notice, which forms part of these terms and conditions.</p>
    <p>All trademarks reproduced in this website which are not the property of, or licensed to, the operator are acknowledged on the website.</p>

    <h2>Unauthorized use</h2>
    <p>Unauthorised use of this website may give rise to a claim for damages and/or be a criminal offence.</p>

    <h2>Links to third party websites</h2>
    <p>From time to time this website may also include links to other websites. These links are provided for your convenience to provide further information. They do not signify that we endorse the website(s). We have no responsibility for the content of the linked website(s).</p>

    <h2>Fees</h2>
    <p>Unless otherwise specified by a separate agreement, fees are to be paid by credit card at the start of each billing period.</p>
    <p>We may increase the Fees by giving at least 30 days’ notice. If you do not wish to pay the increased Fees, you may terminate these Terms and your right to access and use the Service on no less than 10 days’ notice, provided the notice is received by us before the effective date of the Fee increase. If you do not terminate these Terms and your right to access and use the Service in accordance with this clause, you are deemed to have accepted the increased Fees.</p><p/><h2>Subscriptions</h2>
    <p>Unless otherwise specified by a separate agreement, subscriptions are automatically renewed each month until you change your subscription on the <em>Subscriptions</em> page within the application. If you downgrade or cancel your subscription (choosing a cheaper monthly plan), it will be effective starting with the next subscription period. Upgrades take effect immediately.</p>

    <h2>Free trial</h2>
    <p>We may give free trials to selected customers. During the free trial, users have access to all features of a "Pro"-plan as detailed in the <em>Subscriptions</em> page within the application. The trial ends automatically after 30 days, after which you will be downgraded to a free plan without the ability to export additional processed data. The data you uploaded will remain on our platform until you either choose to delete it, or if you request the deletion of your account. In case you would like to continue using Caplena after the free trial, you can purchase a subscription on the <em>Subscriptions</em> page within the application.</p>

    <h2>Law and jurisdiction</h2>
    <p>Your use of this website and any dispute arising out of such use of the website is subject to the laws of city of Zurich, canton of Zurich, Switzerland.</p>

    <h2>Changes To Terms and Conditions</h2>

    <p>We may update our Terms and Conditions from time to time. We will notify you of any changes by posting the new Terms and Conditions to this page and informing existing users by email.</p>

    <p>You are advised to review these Terms and Conditions periodically for any changes. Changes to this document are effective when they are posted on this page.</p>

    <h2>Contact Us</h2>

    <p>If you have any questions about this document, please contact us at <a :href="'mailto:' + email">{{ email }}</a></p>
  </div>
</template>

<script>
export default {
  props: {
    email: { type: String, default: '' }
  }
}
</script>
