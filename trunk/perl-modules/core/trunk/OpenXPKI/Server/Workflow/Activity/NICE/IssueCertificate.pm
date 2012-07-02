# OpenXPKI::Server::Workflow::Activity::NICE::IssueCertificate
# Written by Oliver Welter for the OpenXPKI Project 2011
# Copyright (c) 2011 by The OpenXPKI Project

package OpenXPKI::Server::Workflow::Activity::NICE::IssueCertificate;

use strict;
use base qw( OpenXPKI::Server::Workflow::Activity );

use OpenXPKI::Server::Context qw( CTX );
use OpenXPKI::Exception;
use OpenXPKI::Debug;
use OpenXPKI::Serialization::Simple;

use OpenXPKI::Server::Workflow::NICE::Factory;

use Data::Dumper;

sub execute {
    my $self     = shift;
    my $workflow = shift;

    my $context = $workflow->context();
    
    ##! 32: 'context: ' . Dumper( $context )
    
    my $nice_backend = OpenXPKI::Server::Workflow::NICE::Factory->getHandler( $self );
    
    # Load the CSR indicated by the context parameter from the database 
	my $csr_serial = $context->param( 'csr_serial' );
		
    ##! 32: 'load csr from db: ' . $csr_serial 	
    # get a fresh view of the database
    CTX('dbi_backend')->commit();

    my $csr = CTX('dbi_backend')->first(
        TABLE   => 'CSR',
        KEY => $csr_serial,        
    );
    
    ##! 64: 'csr: ' . Dumper $csr   
    if (! defined $csr) {
	   OpenXPKI::Exception->throw(
	       message => 'I18N_OPENXPKI_SERVER_NICE_CSR_NOT_FOUND_IN_DATABASE',
	       params => { csr_serial => $csr_serial }
       );
    }

    if ($csr->{TYPE} ne 'pkcs10' && $csr->{TYPE} ne 'spkac') {
	   OpenXPKI::Exception->throw(
	       message => 'I18N_OPENXPKI_SERVER_NICE_CSR_WRONG_TYPE',
	       params => { EXPECTED => 'pkcs10/spkac', TYPE => $csr->{TYPE} },
        );
    }   

    my $set_context = $nice_backend->issueCertificate( $csr );

    ##! 64: 'Setting Context ' . Dumper $set_context       
    while (my ($key, $value) = each(%$set_context)) {
        $context->param( $key, $value );
    }
    	
}

1;
__END__

=head1 Name

OpenXPKI::Server::Workflow::Activity::NICE::IssueCertificate;

=head1 Description

Loads the certificate signing request referenced by the csr_serial context
parameter from the database and hands it to the configured NICE backend.

Note that it highly depends on the implementation what properties are taken from
the pkcs10 container and what can be overridden by other means.
The activity allows request types spkac and pkcs10 - you need to adjust this 
if you use other formats.
See documentation of the used backend for details.   

See OpenXPKI::Server::Workflow::NICE::issueCertificate for details

=head1 Parameters

=head2 Input

=item csr_serial - the serial number of the certificate signing request

=head2 Output

=item cert_identifier - the identifier of the issued certificate or I<pending>

